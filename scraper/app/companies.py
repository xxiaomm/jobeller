# (board_token, company_name) pairs verified to have a public Greenhouse job board
# (https://boards-api.greenhouse.io/v1/boards/<board_token>/jobs -> HTTP 200).
GREENHOUSE_COMPANIES: list[tuple[str, str]] = [
    ("airbnb", "Airbnb"),
    ("stripe", "Stripe"),
    ("pinterest", "Pinterest"),
    ("robinhood", "Robinhood"),
    ("coinbase", "Coinbase"),
    ("reddit", "Reddit"),
    ("lyft", "Lyft"),
    ("instacart", "Instacart"),
]
