from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
import json
import logging
from .model_training_bot_admin_v8_two_level import model_training

@csrf_exempt
def train_model(request):
    """
    Function to handle model training requests.

    Handles preflight CORS requests if the method is OPTIONS.
    Parses input parameters from the request JSON object.
    Calls the model_training function with the extracted parameters.
    Returns JSON response with the time taken for model training and status.

    Returns:
        JSON response containing model training status and time taken.
    """
    if request.method == 'OPTIONS':
        # Handle preflight CORS requests
        response = JsonResponse({})
        # response['Access-Control-Allow-Origin'] = '*'
        # response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        # response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

    try:
        data = json.loads(request.body)
        logging.info(f'Request data: {data}')

        required_keys = ['account_name', 'container_name', 'account_key', 'tenant_id', 'blob_storage_id', 'bot_id']
        
        # Print received data for debugging
        print("Received data:", data)

        if data is None or not all(key in data for key in required_keys):
            missing_keys = [key for key in required_keys if key not in data]
            raise ValueError(f'Missing input parameters: {", ".join(missing_keys)}')

        account_name = data['account_name']
        container_name = data['container_name']
        account_key = data['account_key']
        tenant_id = data['tenant_id']
        blob_storage_id = data['blob_storage_id']
        bot_id = data['bot_id']
        logging.error(f"Training pipeline running for Bot with Bucket Name, tenant_id and blob_storage_id: {container_name}_{tenant_id}_{blob_storage_id}")

        #timetoprocessfiles, timetogeneratevectors = model_training(account_name, account_key, container_name, tenant_id, blob_storage_id, bot_id)
        result = model_training(account_name, account_key, container_name, tenant_id, blob_storage_id, bot_id)

        #print(f"Time taken to generate embedding vectors: {timetogeneratevectors}")
        #print(f"Time taken to process files from blob storage: {timetoprocessfiles}")
        #response = JsonResponse({'time_taken_to_generate_embedding_vectors': timetogeneratevectors, 'time_taken_to_process_files_from_blob_storage': timetoprocessfiles, 'status': 'success', 'message': 'Model training completed successfully.'})
        
        if result.get("status") == "success":
            response = JsonResponse({
                "status": "success",
                "message": "Model training completed successfully.",
                "collection_name": result.get("collection_name"),
                "processing_time_seconds": result.get("processing_time_seconds"),
                "embedding_time_seconds": result.get("embedding_time_seconds"),
                "processed_files_count": result.get("processed_files_count"),
                "failed_files_count": result.get("failed_files_count"),
                "processed_files": result.get("processed_files"),
                "failed_files": result.get("failed_files"),
            })
        else:
            response = JsonResponse({
                "status": "error",
                "message": result.get("message", "Training failed")
            }, status=500)

        return response

        # Enable CORS by adding necessary headers
        # response['Access-Control-Allow-Origin'] = '*'
        # response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        # response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        #print(response)

        #return response
    except Exception as e:
        error_msg = f'Error: {e}'
        logging.error(error_msg)
        return JsonResponse({'status': 'error', 'message': error_msg}, status=500)
