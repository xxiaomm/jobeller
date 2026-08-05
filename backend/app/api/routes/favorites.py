from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.favorite import Favorite
from app.models.job import Job
from app.models.user import User
from app.schemas.favorite import FavoriteStatus
from app.schemas.job import JobRead

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=List[JobRead])
async def list_favorite_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Job]:
    stmt = (
        select(Job)
        .join(Favorite, Favorite.job_id == Job.id)
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
    )
    return (await db.execute(stmt)).scalars().all()


@router.post("/{job_id}", response_model=FavoriteStatus)
async def add_favorite(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FavoriteStatus:
    job = await db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = await db.scalar(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.job_id == job_id)
    )
    if existing is None:
        db.add(Favorite(user_id=current_user.id, job_id=job_id))
        await db.commit()

    return FavoriteStatus(job_id=job_id, favorited=True)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await db.execute(
        delete(Favorite).where(Favorite.user_id == current_user.id, Favorite.job_id == job_id)
    )
    await db.commit()
