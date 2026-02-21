from pydantic import BaseModel
from typing import Optional, List

class Medicine(BaseModel):
    name: str
    stock: int
    unit_price: float
    unit_type: str
    prescription_required: bool
    category: str
    max_daily_dose: str

# Phase 1 Simple Order
class Order(BaseModel):
    user_id: str
    medicine: str
    quantity: int
    total_price: float

class FulfillmentPayload(BaseModel):
    order_id: str
    status: str
