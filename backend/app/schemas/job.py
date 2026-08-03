from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class JobBase(BaseModel):
    source: str
    external_id: str
    company: str
    title: str
    level: Optional[str] = None
    location: Optional[str] = None
    min_years_experience: Optional[int] = None
    max_years_experience: Optional[int] = None
    education: Optional[str] = None
    employment_type: Optional[str] = None
    url: str
    description: Optional[str] = None
    posted_at: Optional[datetime] = None
    is_active: bool = True


class JobCreate(JobBase):
    pass


class JobRead(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_seen_at: datetime
    last_seen_at: datetime
    created_at: datetime
    updated_at: datetime


class JobList(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[JobRead]


class JobSyncRequest(BaseModel):
    source: str
    jobs: List[JobCreate]


class JobSyncResult(BaseModel):
    created: int
    updated: int
