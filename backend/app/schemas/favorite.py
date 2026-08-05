from pydantic import BaseModel


class FavoriteStatus(BaseModel):
    job_id: int
    favorited: bool
