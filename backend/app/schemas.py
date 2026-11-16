from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

OrderStatus = Literal["new", "processing", "shipped", "delivered", "cancelled"]


class OrderItemIn(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=20)


class ShippingIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    phone: str = Field(pattern=r"^[6-9]\d{9}$")
    address: str = Field(min_length=5, max_length=200)
    city: str = Field(min_length=2, max_length=60)
    pincode: str = Field(pattern=r"^\d{6}$")


class OrderIn(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1, max_length=30)
    shipping: ShippingIn


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=40)
    description: str = Field(default="", max_length=1000)
    price: int = Field(gt=0, le=1_000_000)
    stock: int = Field(ge=0, le=100_000)
    image_url: str = Field(default="", max_length=500)

    @field_validator("name", "category", "description", "image_url")
    @classmethod
    def strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("image_url")
    @classmethod
    def check_url(cls, value: str) -> str:
        if value and not (value.startswith("/") or value.startswith("http://") or value.startswith("https://")):
            raise ValueError("Image URL must start with http://, https:// or /")
        return value


class StatusIn(BaseModel):
    status: OrderStatus
