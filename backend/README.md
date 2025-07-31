# FitTransform Backend

A Django REST API backend for the FitTransform fitness app, providing personalized workout plans, progress tracking, and AI-powered recommendations.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **User Profiles**: Complete user profiles with body composition and measurements
- **Onboarding Flow**: Multi-step onboarding process for new users
- **Workout Management**: AI-generated and custom workout plans
- **Progress Tracking**: Comprehensive progress analytics and goal tracking
- **AI Integration**: OpenAI/Claude integration for personalized recommendations
- **Real-time Features**: WebSocket support for live workout sessions

## Tech Stack

- **Django 4.2.7**: Web framework
- **Django REST Framework**: API framework
- **JWT Authentication**: Secure token-based authentication
- **SQLite**: Database (development)
- **PostgreSQL**: Database (production ready)
- **OpenAI/Claude**: AI integration for workout generation
- **Django Channels**: Real-time features

## Project Structure

```
backend/
├── fitness_project/          # Main Django project
│   ├── settings.py          # Project settings
│   ├── urls.py              # Main URL configuration
│   └── wsgi.py              # WSGI configuration
├── users/                   # User management app
│   ├── models.py            # User, BodyComposition, BodyMeasurements models
│   ├── serializers.py       # User serializers
│   ├── views.py             # User views and authentication
│   └── urls.py              # User URL patterns
├── workouts/                # Workout management app
│   ├── models.py            # Exercise, WorkoutPlan, WorkoutSession models
│   ├── serializers.py       # Workout serializers
│   ├── views.py             # Workout views
│   └── urls.py              # Workout URL patterns
├── progress/                # Progress tracking app
│   ├── models.py            # ProgressEntry, Analytics, Goal models
│   ├── serializers.py       # Progress serializers
│   ├── views.py             # Progress views
│   └── urls.py              # Progress URL patterns
├── ai_engine/               # AI integration app
│   ├── models.py            # AIRequest, AIRecommendation models
│   ├── serializers.py       # AI serializers
│   ├── views.py             # AI views
│   └── urls.py              # AI URL patterns
├── requirements.txt         # Python dependencies
└── manage.py               # Django management script
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh JWT token

### User Profile
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update user profile
- `GET /api/auth/profile/complete/` - Get complete profile with related data

### Onboarding
- `POST /api/auth/onboarding/step/` - Update onboarding step
- `POST /api/auth/onboarding/complete/` - Complete onboarding

### Body Data
- `POST /api/auth/body-composition/` - Update body composition
- `POST /api/auth/measurements/` - Update body measurements
- `POST /api/auth/goal-measurements/` - Update goal measurements

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fitnessAPP/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Database Models

### User Models
- **User**: Custom user model with fitness profile
- **BodyComposition**: Body composition measurements
- **BodyMeasurements**: Body measurements for 3D model
- **GoalMeasurements**: Target measurements for goals

### Workout Models
- **Exercise**: Exercise database
- **WorkoutPlan**: Workout plans with schedules
- **WorkoutDay**: Individual days in a workout plan
- **WorkoutExercise**: Exercises within workout days
- **WorkoutSession**: Individual workout sessions
- **ExerciseSet**: Individual sets within sessions

### Progress Models
- **ProgressEntry**: Individual progress entries
- **WorkoutProgress**: Progress tracking for workout plans
- **Goal**: User fitness goals
- **Analytics**: Progress analytics data

### AI Models
- **AIRequest**: Track AI requests
- **AIRecommendation**: AI-generated recommendations
- **AITrainingData**: Training data for AI improvement
- **AIModelVersion**: Track AI model versions

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations <app_name>
```

### Applying Migrations
```bash
python manage.py migrate
```

### Django Admin
Access the admin interface at `http://192.168.0.105:8000/admin/`

## Production Deployment

1. Set `DEBUG=False` in settings
2. Configure production database (PostgreSQL)
3. Set up static file serving
4. Configure environment variables
5. Set up SSL/TLS certificates
6. Configure web server (Nginx + Gunicorn)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License. 