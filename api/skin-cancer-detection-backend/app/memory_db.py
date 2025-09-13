# Temporary in-memory database for testing when MongoDB is not available
from typing import Dict, List, Optional
from datetime import datetime
import uuid

# In-memory storage
users_db: Dict[str, dict] = {}
doctors_db: Dict[str, dict] = {}
patients_db: Dict[str, dict] = {}
appointments_db: Dict[str, dict] = {}
predictions_db: Dict[str, dict] = {}

class MemoryCollection:
    """Collection wrapper for memory database to mimic MongoDB collection interface"""
    
    def __init__(self, collection_name: str, memory_db: 'MemoryDB'):
        self.collection_name = collection_name
        self.memory_db = memory_db
    
    async def find_one(self, filter_dict: dict) -> Optional[dict]:
        return await self.memory_db.find_one(self.collection_name, filter_dict)
    
    async def insert_one(self, document: dict) -> dict:
        return await self.memory_db.insert_one(self.collection_name, document)
    
    async def find(self, filter_dict: dict = None) -> List[dict]:
        return await self.memory_db.find(self.collection_name, filter_dict)
    
    async def update_one(self, filter_dict: dict, update_dict: dict) -> dict:
        return await self.memory_db.update_one(self.collection_name, filter_dict, update_dict)
    
    async def delete_one(self, filter_dict: dict) -> dict:
        return await self.memory_db.delete_one(self.collection_name, filter_dict)

class MemoryDB:
    def __init__(self):
        self.users = users_db
        self.doctors = doctors_db
        self.patients = patients_db
        self.appointments = appointments_db
        self.predictions = predictions_db
    
    def get_collection(self, collection_name: str) -> MemoryCollection:
        """Get a collection wrapper"""
        return MemoryCollection(collection_name, self)
    
    async def find_one(self, collection: str, filter_dict: dict) -> Optional[dict]:
        """Find one document in a collection"""
        storage = getattr(self, collection, {})
        for doc_id, doc in storage.items():
            match = True
            for key, value in filter_dict.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                return {**doc, "_id": doc_id}
        return None
    
    async def insert_one(self, collection: str, document: dict) -> dict:
        """Insert one document into a collection"""
        storage = getattr(self, collection, {})
        doc_id = str(uuid.uuid4())
        document_with_id = {**document, "_id": doc_id}
        storage[doc_id] = document_with_id
        return {"inserted_id": doc_id}
    
    async def find(self, collection: str, filter_dict: dict = None) -> List[dict]:
        """Find multiple documents in a collection"""
        storage = getattr(self, collection, {})
        if filter_dict is None:
            return list(storage.values())
        
        results = []
        for doc_id, doc in storage.items():
            match = True
            for key, value in filter_dict.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                results.append({**doc, "_id": doc_id})
        return results
    
    async def update_one(self, collection: str, filter_dict: dict, update_dict: dict) -> dict:
        """Update one document in a collection"""
        storage = getattr(self, collection, {})
        for doc_id, doc in storage.items():
            match = True
            for key, value in filter_dict.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                if "$set" in update_dict:
                    doc.update(update_dict["$set"])
                else:
                    doc.update(update_dict)
                return {"modified_count": 1}
        return {"modified_count": 0}

# Global memory database instance
memory_db = MemoryDB()

# Create some sample data for testing
async def init_sample_data():
    """Initialize some sample data for testing"""
    # Create a sample user
    sample_user = {
        "email": "test@example.com",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "role": "doctor",
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    await memory_db.insert_one("users", sample_user)
    print("📝 Sample data initialized in memory database")
