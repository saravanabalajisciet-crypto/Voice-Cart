
PRODUCTS = [
    {
        "id": "P001",
        "name": "Prestige Popular Aluminium Pressure Cooker",
        "category": "cooker",
        "size": "3 Litre",
        "price": 899,
        "stock": 12,
        "description": "3 litre aluminium pressure cooker"
    },
    {
        "id": "P002",
        "name": "Pigeon Favourite Aluminium Cooker",
        "category": "cooker",
        "size": "3 Litre",
        "price": 749,
        "stock": 8,
        "description": "Compact 3 litre aluminium cooker"
    },
    {
        "id": "P003",
        "name": "Prestige Deluxe Pressure Cooker",
        "category": "cooker",
        "size": "5 Litre",
        "price": 1199,
        "stock": 5,
        "description": "5 litre pressure cooker"
    },
    {
        "id": "P004",
        "name": "Butterfly Mixer Grinder",
        "category": "mixer",
        "size": "750 Watt",
        "price": 2499,
        "stock": 7,
        "description": "Mixer grinder with three jars"
    },
    {
        "id": "P005",
        "name": "Havells Table Fan",
        "category": "fan",
        "size": "400 mm",
        "price": 1899,
        "stock": 4,
        "description": "Table fan for home use"
    },
    {
        "id": "P006",
        "name": "Pigeon Electric Rice Cooker",
        "category": "rice cooker",
        "size": "1.8 Litre",
        "price": 1499,
        "stock": 6,
        "description": "Electric rice cooker"
    }
]


def search_products(category: str, max_price: int = None):
    results = []

    for product in PRODUCTS:
        if category.lower() in product["category"].lower():
            if max_price is None or product["price"] <= max_price:
                results.append(product)

    return results
