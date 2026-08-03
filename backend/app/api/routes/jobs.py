from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.job import Job
from app.schemas.job import JobCreate, JobList, JobRead, JobSyncRequest, JobSyncResult

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=JobList)
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    title: Optional[str] = Query(None, description="Fuzzy match on job title"),
    company: Optional[str] = Query(None, description="Fuzzy match on company name"),
    level: Optional[str] = None,
    location: Optional[str] = Query(None, description="Fuzzy match on location"),
    min_years: Optional[int] = Query(None, description="Job's minimum required years <= this value"),
    max_years: Optional[int] = Query(None, description="Job's maximum required years >= this value"),
    education: Optional[str] = None,
    min_salary: Optional[int] = Query(None, description="Job's max salary >= this value"),
    visa_type: Optional[str] = None,
    posted_after: Optional[datetime] = None,
    posted_before: Optional[datetime] = None,
    is_active: Optional[bool] = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> JobList:
    filters = []
    if title:
        filters.append(Job.title.ilike(f"%{title}%"))
    if company:
        filters.append(Job.company.ilike(f"%{company}%"))
    if level:
        filters.append(Job.level == level)
    if location:
        filters.append(Job.location.ilike(f"%{location}%"))
    if min_years is not None:
        filters.append(Job.min_years_experience <= min_years)
    if max_years is not None:
        filters.append(Job.max_years_experience >= max_years)
    if education:
        filters.append(Job.education == education)
    if min_salary is not None:
        filters.append(Job.salary_max >= min_salary)
    if visa_type:
        filters.append(Job.visa_type == visa_type)
    if posted_after:
        filters.append(Job.posted_at >= posted_after)
    if posted_before:
        filters.append(Job.posted_at <= posted_before)
    if is_active is not None:
        filters.append(Job.is_active == is_active)

    count_stmt = select(func.count()).select_from(Job).where(*filters)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = (
        select(Job)
        .where(*filters)
        .order_by(Job.posted_at.desc().nullslast(), Job.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    jobs = (await db.execute(stmt)).scalars().all()

    return JobList(total=total, page=page, page_size=page_size, items=jobs)


@router.get("/{job_id}", response_model=JobRead)
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)) -> Job:
    job = await db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=JobRead, status_code=201)
async def create_job(payload: JobCreate, db: AsyncSession = Depends(get_db)) -> Job:
    job = Job(**payload.model_dump())
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.post("/sync", response_model=JobSyncResult)
async def sync_jobs(payload: JobSyncRequest, db: AsyncSession = Depends(get_db)) -> JobSyncResult:
    if not payload.jobs:
        return JobSyncResult(created=0, updated=0)

    external_ids = [job.external_id for job in payload.jobs]
    stmt = select(Job).where(Job.source == payload.source, Job.external_id.in_(external_ids))
    existing_by_external_id = {job.external_id: job for job in (await db.execute(stmt)).scalars().all()}

    created = 0
    updated = 0
    now = datetime.now(timezone.utc)

    for item in payload.jobs:
        data = item.model_dump()
        data["source"] = payload.source
        existing_job = existing_by_external_id.get(item.external_id)
        if existing_job is not None:
            for field, value in data.items():
                setattr(existing_job, field, value)
            existing_job.last_seen_at = now
            existing_job.is_active = True
            updated += 1
        else:
            db.add(Job(**data))
            created += 1

    await db.commit()
    return JobSyncResult(created=created, updated=updated)
