# MongoDB Setup Guide

## Prerequisites
1. Install MongoDB Community Edition
2. Install Python 3.8+
3. Install the required Python packages

## Installation Steps

### 1. Install MongoDB Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up Environment Variables
Create a `.env` file in the `app/` directory with the following content:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
mongo_db_name=skin_cancer_detection

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
FROM_EMAIL=your-email@gmail.com

# API Configuration
API_TITLE=Skin Cancer Detection API
API_VERSION=1.0.0
MODEL_PATH=models/skin_cancer_model.h5

# CORS Origins
ALLOWED_ORIGINS=["http://localhost:4200", "http://localhost:3000", "https://your-frontend-domain.com"]
```

### 3. Start MongoDB Service
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

### 4. Verify MongoDB Connection
```bash
mongosh
# or
mongo
```

### 5. Run the Backend
```bash
cd api/skin-cancer-detection-backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Database Collections

The following collections will be automatically created when you first use the API:

- `users` - User accounts and authentication
- `doctors` - Doctor profiles
- `patients` - Patient profiles  
- `appointments` - Appointment scheduling
- `prediction_history` - ML model predictions
- `verification_tokens` - Email verification
- `password_reset_tokens` - Password reset functionality

## Troubleshooting

### Common Issues:

1. **Connection Refused**: Make sure MongoDB service is running
2. **Authentication Failed**: Check your MongoDB connection string
3. **Database Not Found**: The database will be created automatically on first use

### MongoDB Commands:

```bash
# List databases
show dbs

# Use database
use skin_cancer_detection

# List collections
show collections

# View documents in a collection
db.users.find()
```

## Migration from SQLite

If you're migrating from SQLite:

1. Export your existing data
2. Transform the data to match MongoDB document structure
3. Import using MongoDB tools or scripts
4. Update frontend to use string IDs instead of integers

## Security Notes

- Change the default SECRET_KEY in production
- Use environment variables for sensitive data
- Consider using MongoDB Atlas for production deployments
- Enable MongoDB authentication for production use
