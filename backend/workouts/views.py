from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutSession, ExerciseSet
from .serializers import (
    ExerciseSerializer, WorkoutPlanSerializer, WorkoutDaySerializer,
    WorkoutExerciseSerializer, WorkoutSessionSerializer, ExerciseSetSerializer
)
from users.models import User
from django.db import models

# Create your views here.

# --- Exercise CRUD ---
class ExerciseListCreateView(generics.ListCreateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

class ExerciseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- Workout Plan CRUD ---
class WorkoutPlanListCreateView(generics.ListCreateAPIView):
    queryset = WorkoutPlan.objects.all()
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class WorkoutPlanRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WorkoutPlan.objects.all()
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- User-specific Workout Plans ---
class UserWorkoutPlansView(generics.ListAPIView):
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutPlan.objects.filter(created_by=self.request.user)

# --- Workout Day CRUD ---
class WorkoutDayListCreateView(generics.ListCreateAPIView):
    queryset = WorkoutDay.objects.all()
    serializer_class = WorkoutDaySerializer
    permission_classes = [permissions.IsAuthenticated]

class WorkoutDayRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WorkoutDay.objects.all()
    serializer_class = WorkoutDaySerializer
    permission_classes = [permissions.IsAuthenticated]

# --- Workout Session CRUD ---
class WorkoutSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🏋️ Workout session creation request received")
        logger.info(f"👤 User: {request.user.email}")
        logger.info(f"📦 Request data: {request.data}")
        
        try:
            response = super().create(request, *args, **kwargs)
            logger.info(f"✅ Workout session created successfully: {response.data}")
            return response
        except Exception as e:
            logger.error(f"❌ Workout session creation failed: {str(e)}")
            raise

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"💾 Saving workout session...")
        serializer.save(user=self.request.user)
        logger.info(f"✅ Workout session saved successfully")

class WorkoutSessionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)

# --- ExerciseSet CRUD ---
class ExerciseSetListCreateView(generics.ListCreateAPIView):
    serializer_class = ExerciseSetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExerciseSet.objects.filter(session__user=self.request.user)

    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"💪 Exercise set creation request received")
        logger.info(f"👤 User: {request.user.email}")
        logger.info(f"📦 Request data: {request.data}")
        
        try:
            response = super().create(request, *args, **kwargs)
            logger.info(f"✅ Exercise set created successfully: {response.data}")
            return response
        except Exception as e:
            logger.error(f"❌ Exercise set creation failed: {str(e)}")
            raise

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"💾 Saving exercise set...")
        serializer.save()
        logger.info(f"✅ Exercise set saved successfully")

class ExerciseSetRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExerciseSetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExerciseSet.objects.filter(session__user=self.request.user)

# --- Additional API endpoints for better data management ---

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_workout_stats(request):
    """Get user's workout statistics"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        total_sessions = WorkoutSession.objects.filter(user=user).count()
        completed_sessions = WorkoutSession.objects.filter(user=user, status='completed').count()
        total_workout_time = WorkoutSession.objects.filter(user=user, status='completed').aggregate(
            total_time=models.Sum('duration')
        )['total_time'] or 0
        
        # Get recent sessions
        recent_sessions = WorkoutSession.objects.filter(user=user).order_by('-created_at')[:5]
        
        stats = {
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'total_workout_time': total_workout_time,
            'completion_rate': (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0,
            'recent_sessions': WorkoutSessionSerializer(recent_sessions, many=True).data
        }
        
        logger.info(f"📊 Workout stats retrieved for user {user.email}: {stats}")
        return Response(stats)
        
    except Exception as e:
        logger.error(f"❌ Error getting workout stats: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_workout_progress(request):
    """Save workout progress data"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        data = request.data
        
        logger.info(f"💾 Saving workout progress for user {user.email}")
        logger.info(f"📦 Progress data: {data}")
        
        # Create or update workout session
        session_data = data.get('session', {})
        session, created = WorkoutSession.objects.get_or_create(
            id=session_data.get('id'),
            defaults={
                'user': user,
                'status': session_data.get('status', 'completed'),
                'started_at': session_data.get('started_at'),
                'completed_at': session_data.get('completed_at'),
                'duration': session_data.get('duration'),
                'total_exercises': session_data.get('total_exercises', 0),
                'completed_exercises': session_data.get('completed_exercises', 0),
                'notes': session_data.get('notes', ''),
                'rating': session_data.get('rating')
            }
        )
        
        if not created:
            # Update existing session
            for field, value in session_data.items():
                if hasattr(session, field):
                    setattr(session, field, value)
            session.save()
        
        # Save exercise sets
        exercise_sets = data.get('exercise_sets', [])
        for set_data in exercise_sets:
            ExerciseSet.objects.create(
                session=session,
                exercise_id=set_data['exercise_id'],
                set_number=set_data['set_number'],
                reps_completed=set_data['reps_completed'],
                weight_used=set_data.get('weight_used'),
                duration=set_data.get('duration'),
                rest_time=set_data.get('rest_time'),
                notes=set_data.get('notes', ''),
                difficulty_rating=set_data.get('difficulty_rating')
            )
        
        logger.info(f"✅ Workout progress saved successfully")
        return Response({'message': 'Workout progress saved successfully', 'session_id': session.id})
        
    except Exception as e:
        logger.error(f"❌ Error saving workout progress: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_workout_history(request):
    """Get user's workout history"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        sessions = WorkoutSession.objects.filter(user=user).order_by('-created_at')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_sessions = sessions[start:end]
        
        history = {
            'sessions': WorkoutSessionSerializer(paginated_sessions, many=True).data,
            'total_sessions': sessions.count(),
            'page': page,
            'page_size': page_size,
            'has_next': end < sessions.count()
        }
        
        logger.info(f"📚 Workout history retrieved for user {user.email}")
        return Response(history)
        
    except Exception as e:
        logger.error(f"❌ Error getting workout history: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
