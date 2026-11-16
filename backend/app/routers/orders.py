from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import current_user
from ..schemas import OrderIn

router = APIRouter()


@router.post("/orders", status_code=201)
async def create_order(payload: OrderIn, user: dict = Depends(current_user)):
    # Merge repeated products and sort by id so row locks are taken in a
    # consistent order inside the database function.
    merged: dict[str, int] = {}
    for item in payload.items:
        key = str(item.product_id)
        merged[key] = merged.get(key, 0) + item.quantity
    items = [{"product_id": pid, "quantity": qty} for pid, qty in sorted(merged.items())]

    if any(i["quantity"] > 20 for i in items):
        raise HTTPException(422, "A maximum of 20 units per product is allowed.")

    try:
        order_id = await db.rpc(
            "place_order",
            {"p_user": user["id"], "p_items": items, "p_shipping": payload.shipping.model_dump()},
        )
    except db.DBError as exc:
        if exc.message.startswith("OUT_OF_STOCK:"):
            name = exc.message.split(":", 1)[1]
            raise HTTPException(409, f"Not enough stock for {name}. Update your cart and try again.")
        if exc.message.startswith("PRODUCT_MISSING"):
            raise HTTPException(409, "A product in your cart is no longer available.")
        raise

    return {"id": order_id}


@router.get("/orders/mine")
async def my_orders(user: dict = Depends(current_user)):
    return await db.select(
        "orders",
        {
            "user_id": f"eq.{user['id']}",
            "select": "*,order_items(*)",
            "order": "created_at.desc",
        },
    )
