import csv
import json
from app.vector_store import vector_store  # adjust import if needed


OUTPUT_FILE = "chroma_export.csv"


def export_chroma_to_csv(output_file: str):
    collection = vector_store.collection

    results = collection.get(
        include=["embeddings", "metadatas", "documents"]
    )

    if not results or not results.get("ids"):
        print("No data found in Chroma collection.")
        return

    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "doc_id",
                "contract_id",
                "document",
                "embedding",
                "metadata",
            ],
        )
        writer.writeheader()

        for i, doc_id in enumerate(results["ids"]):
            metadata = results["metadatas"][i] or {}
            embedding = results["embeddings"][i] if results["embeddings"] else None
            document = results["documents"][i] if results["documents"] else ""

            writer.writerow({
                "doc_id": doc_id,
                "contract_id": metadata.get("contract_id", ""),
                "document": document,
                "embedding": json.dumps(embedding) if embedding else "",
                "metadata": json.dumps(metadata),
            })

    print(f"✅ Export complete: {output_file}")


if __name__ == "__main__":
    export_chroma_to_csv(OUTPUT_FILE)
