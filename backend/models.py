from pydantic import BaseModel


class Preferences(BaseModel):
    upperBody: float = 0.5
    lowerBody: float = 0.5
    core: float = 0.5
    balance: float = 0.4
    intensity: float = 0.5


class FeedRequest(BaseModel):
    condition: str
    phase: str
    preferences: Preferences = Preferences()
    completedExercises: list[str] = []


class KnowledgeRequest(BaseModel):
    condition: str
    phase: str
