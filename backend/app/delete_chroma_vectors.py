import sys
from typing import List, Optional
from app.vector_store import vector_store


def delete_all_vectors(confirm: bool = False):
    """
    Delete ALL vectors in the Chroma collection.
    Requires explicit confirmation.
    """
    collection = vector_store.collection
    count = collection.count()

    if count == 0:
        print("ℹ️ No vectors found. Nothing to delete.")
        return

    print(f"⚠️ Found {count} vectors in collection.")

    if not confirm:
        print("❌ Deletion NOT executed.")
        print("👉 Re-run with --confirm to actually delete.")
        return

    # Fetch all IDs first
    results = collection.get(include=[])
    ids = results.get("ids", [])

    if not ids:
        print("ℹ️ No IDs found.")
        return

    collection.delete(ids=ids)
    print(f"✅ Deleted {len(ids)} vectors.")


def delete_by_contract_ids(contract_ids: List[int]):
    """
    Delete vectors for specific contract IDs.
    """
    ids = [f"contract_{cid}" for cid in contract_ids]

    vector_store.collection.delete(ids=ids)
    print(f"✅ Deleted vectors for contracts: {contract_ids}")


if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        print("""
Usage:
  Delete ALL vectors (dry run):
    python -m app.delete_chroma_vectors

  Delete ALL vectors (actual delete):
    python -m app.delete_chroma_vectors --confirm

  Delete specific contracts:
    python -m app.delete_chroma_vectors --contracts 101 102 103
""")
        sys.exit(0)

    if "--contracts" in args:
        idx = args.index("--contracts")
        contract_ids = list(map(int, args[idx + 1:]))
        delete_by_contract_ids(contract_ids)
    else:
        confirm = "--confirm" in args
        delete_all_vectors(confirm=confirm)
