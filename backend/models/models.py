from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from core.database import Base
import uuid

def gen_id():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "interviewa_users"
    id            = Column(String, primary_key=True, default=gen_id)
    email         = Column(String, unique=True, nullable=False)
    hashed_pw     = Column(String, nullable=False)
    name          = Column(String, nullable=False)
    created_at    = Column(DateTime, server_default=func.now())

class Interview(Base):
    __tablename__ = "interviewa_interviews"
    id                     = Column(String, primary_key=True, default=gen_id)
    user_id                = Column(String, nullable=False)
    role                   = Column(String, nullable=False)   # frontend, backend, fullstack, devops, ml
    level                  = Column(String, nullable=False)   # junior, mid, senior, staff
    company                = Column(String, nullable=True, default="")
    rounds                 = Column(JSON)                     # ["dsa","system_design","technical","hr"]
    job_description        = Column(Text, default="")
    resume_text            = Column(Text, default="")
    extracted_profile      = Column(JSON, default={})
    status                 = Column(String, default="pending")
    current_round          = Column(Integer, default=0)
    current_question_index = Column(Integer, default=0)
    created_at             = Column(DateTime, server_default=func.now())

class Question(Base):
    __tablename__ = "interviewa_questions"
    id            = Column(String, primary_key=True, default=gen_id)
    interview_id  = Column(String, nullable=False)
    round_name    = Column(String, nullable=False)
    round_index   = Column(Integer, nullable=False)
    order_index   = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    difficulty    = Column(String, default="medium")
    topic         = Column(String, default="")
    what_to_look  = Column(Text, default="")
    is_coding     = Column(Boolean, default=False)

class InterviewMessage(Base):
    __tablename__ = "interviewa_messages"
    id            = Column(String, primary_key=True, default=gen_id)
    interview_id  = Column(String, nullable=False)
    question_id   = Column(String, nullable=False)
    role          = Column(String, nullable=False)  # "user" or "ai"
    content       = Column(Text, nullable=False)
    created_at    = Column(DateTime, server_default=func.now())

class Answer(Base):
    __tablename__ = "interviewa_answers"
    id            = Column(String, primary_key=True, default=gen_id)
    interview_id  = Column(String, nullable=False)
    question_id   = Column(String, nullable=False)
    round_name    = Column(String, nullable=False)
    answer_text   = Column(Text, nullable=False)
    code          = Column(Text, default="")
    score         = Column(Float, default=0)
    feedback      = Column(Text, default="")
    better_answer = Column(Text, default="")
    submitted_at  = Column(DateTime, server_default=func.now())

class Report(Base):
    __tablename__ = "interviewa_reports"
    id               = Column(String, primary_key=True, default=gen_id)
    interview_id     = Column(String, unique=True, nullable=False)
    scores_by_round  = Column(JSON, default={})
    overall_score    = Column(Float, default=0)
    strengths        = Column(JSON, default=[])
    weaknesses       = Column(JSON, default=[])
    recommendation   = Column(String, default="maybe")
    summary          = Column(Text, default="")
    created_at       = Column(DateTime, server_default=func.now())