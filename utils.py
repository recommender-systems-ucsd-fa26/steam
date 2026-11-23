"""Shared helpers for the Steam notebooks: price cleaning, loading, and widgets."""
import ast
from pathlib import Path

import anywidget
import polars as pl
import traitlets

DEMOS = Path(__file__).parent / "demos"
LABELS = ["free", "$0-5", "$5-10", "$10-20", "$20-30", "$30-60", "$60+"]


def clean_price(v):
    """List price in dollars: free variants -> 0.0, non-price strings -> None."""
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str) and "free" in v.lower():
        return 0.0
    return None


def bucket(col):
    """Price bucket index 0..6 (ordered as LABELS), named `<col>_b`."""
    return (pl.col(col).cut([0, 4.99, 9.99, 19.99, 29.99, 59.99], labels=LABELS)
            .cast(pl.Enum(LABELS)).to_physical().alias(f"{col}_b"))


def load_games(path):
    """One row per game id, with a cleaned price (and the raw value, for the drop report)."""
    with open(path) as f:
        games = pl.DataFrame(
            [{"product_id": g.get("id"), "title": g.get("app_name"), "price": clean_price(g.get("price")),
              "price_raw": None if g.get("price") is None else str(g["price"]),
              "genres": g.get("genres") or [], "release": g.get("release_date")}
             for g in map(ast.literal_eval, f)],
            schema={"product_id": pl.Utf8, "title": pl.Utf8, "price": pl.Float64, "price_raw": pl.Utf8,
                    "genres": pl.List(pl.Utf8), "release": pl.Utf8},
        )
    return (games.drop_nulls("product_id").unique("product_id", keep="last")
                 .with_columns(release=pl.col("release").str.to_date("%Y-%m-%d", strict=False),
                               genres=pl.col("genres").list.eval(pl.element().str.replace("&amp;", "&", literal=True))))


class UserTimeline(anywidget.AnyWidget):
    _esm = DEMOS / "user_timeline.js"
    users = traitlets.List().tag(sync=True)
