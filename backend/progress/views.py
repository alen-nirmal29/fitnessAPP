from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import ProgressEntry, WorkoutProgress, Goal, Analytics, CompletedWorkout
from .serializers import ProgressEntrySerializer, WorkoutProgressSerializer, GoalSerializer, AnalyticsSerializer, CompletedWorkoutSerializer
from users.models import User
from django.db import models

# Create your views here.

# --- ProgressEntry CRUD ---
class ProgressEntryListCreateView(generics.ListCreateAPIView):
    serializer_class = ProgressEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProgressEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get(self, request, *args, **kwargs):
        """GET method with debugging"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Progress entries GET request from user: {request.user}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"User authenticated: {request.user.is_authenticated}")
        
        return super().get(request, *args, **kwargs)

class ProgressEntryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProgressEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProgressEntry.objects.filter(user=self.request.user)

# --- WorkoutProgress CRUD ---
class WorkoutProgressListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutProgress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WorkoutProgressRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkoutProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutProgress.objects.filter(user=self.request.user)

# --- Goal CRUD ---
class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GoalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

# --- Analytics CRUD ---
class AnalyticsListCreateView(generics.ListCreateAPIView):
    serializer_class = AnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Analytics.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AnalyticsRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Analytics.objects.filter(user=self.request.user)

# --- CompletedWorkout CRUD ---
class CompletedWorkoutListCreateView(generics.ListCreateAPIView):
    serializer_class = CompletedWorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CompletedWorkout.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CompletedWorkoutRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CompletedWorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CompletedWorkout.objects.filter(user=self.request.user)

# --- Additional API endpoints for better data management ---

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_progress_entry(request):
    """Save progress entry with measurements and body composition"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        data = request.data
        
        logger.info(f"💾 Saving progress entry for user {user.email}")
        logger.info(f"📦 Progress data: {data}")
        
        # Create or update progress entry
        progress_entry, created = ProgressEntry.objects.get_or_create(
            user=user,
            date=data.get('date'),
            defaults={
                'weight': data.get('weight'),
                'chest': data.get('chest'),
                'neck': data.get('neck'),
                'waist': data.get('waist'),
                'left_arm': data.get('left_arm'),
                'right_arm': data.get('right_arm'),
                'left_thigh': data.get('left_thigh'),
                'right_thigh': data.get('right_thigh'),
                'shoulders': data.get('shoulders'),
                'hips': data.get('hips'),
                'calves': data.get('calves'),
                'body_fat': data.get('body_fat'),
                'muscle_mass': data.get('muscle_mass'),
                'bmi': data.get('bmi'),
                'notes': data.get('notes', '')
            }
        )
        
        # Update existing entry if found
        if not created:
            for field, value in data.items():
                if field != 'date' and field != 'user' and hasattr(progress_entry, field):
                    setattr(progress_entry, field, value)
            progress_entry.save()
        
        logger.info(f"✅ Progress entry saved successfully: {progress_entry.id}")
        return Response({
            'message': 'Progress entry saved successfully',
            'entry_id': progress_entry.id
        })
        
    except Exception as e:
        logger.error(f"❌ Error saving progress entry: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_progress_history(request):
    """Get user's progress history"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        entries = ProgressEntry.objects.filter(user=user).order_by('-date')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_entries = entries[start:end]
        
        history = {
            'entries': ProgressEntrySerializer(paginated_entries, many=True).data,
            'total_entries': entries.count(),
            'page': page,
            'page_size': page_size,
            'has_next': end < entries.count()
        }
        
        logger.info(f"📚 Progress history retrieved for user {user.email}")
        return Response(history)
        
    except Exception as e:
        logger.error(f"❌ Error getting progress history: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_progress_stats(request):
    """Get user's progress statistics"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        entries = ProgressEntry.objects.filter(user=user).order_by('-date')
        
        if not entries.exists():
            return Response({
                'message': 'No progress entries found',
                'stats': {}
            })
        
        # Get latest and earliest entries
        latest_entry = entries.first()
        earliest_entry = entries.last()
        
        # Calculate weight change
        weight_change = None
        if latest_entry.weight and earliest_entry.weight:
            weight_change = float(latest_entry.weight) - float(earliest_entry.weight)
        
        # Calculate measurement changes
        measurement_changes = {}
        if latest_entry and earliest_entry:
            measurements = ['chest', 'neck', 'waist', 'left_arm', 'right_arm', 'left_thigh', 'right_thigh', 'shoulders', 'hips', 'calves']
            for measurement in measurements:
                latest_val = getattr(latest_entry, measurement)
                earliest_val = getattr(earliest_entry, measurement)
                if latest_val and earliest_val:
                    measurement_changes[measurement] = float(latest_val) - float(earliest_val)
        
        stats = {
            'total_entries': entries.count(),
            'latest_entry_date': latest_entry.date if latest_entry else None,
            'earliest_entry_date': earliest_entry.date if earliest_entry else None,
            'weight_change': weight_change,
            'measurement_changes': measurement_changes,
            'current_weight': float(latest_entry.weight) if latest_entry and latest_entry.weight else None,
            'current_body_fat': float(latest_entry.body_fat) if latest_entry and latest_entry.body_fat else None,
            'current_bmi': float(latest_entry.bmi) if latest_entry and latest_entry.bmi else None,
        }
        
        logger.info(f"📊 Progress stats retrieved for user {user.email}: {stats}")
        return Response(stats)
        
    except Exception as e:
        logger.error(f"❌ Error getting progress stats: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_goal(request):
    """Save user goal"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        data = request.data
        
        logger.info(f"🎯 Saving goal for user {user.email}")
        logger.info(f"📦 Goal data: {data}")
        
        goal = Goal.objects.create(
            user=user,
            title=data.get('title'),
            description=data.get('description'),
            goal_type=data.get('goal_type'),
            target_value=data.get('target_value'),
            target_date=data.get('target_date'),
            current_value=data.get('current_value'),
            progress_percentage=data.get('progress_percentage', 0)
        )
        
        logger.info(f"✅ Goal saved successfully: {goal.id}")
        return Response({
            'message': 'Goal saved successfully',
            'goal_id': goal.id
        })
        
    except Exception as e:
        logger.error(f"❌ Error saving goal: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_completed_workout(request):
    """Save completed workout data"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        data = request.data
        
        logger.info(f"💪 Saving completed workout for user {user.email}")
        logger.info(f"📦 Workout data: {data}")
        
        # Create the completed workout
        completed_workout = CompletedWorkout.objects.create(
            user=user,
            workout_name=data.get('workout_name'),
            workout_type=data.get('workout_type', ''),
            date=data.get('date'),
            duration=data.get('duration', 0),
            calories_burned=data.get('calories_burned', 0),
            exercises_completed=data.get('exercises_completed', 0),
            notes=data.get('notes', ''),
            rating=data.get('rating')
        )
        
        # Get all completed workouts for the user
        user_workouts = CompletedWorkout.objects.filter(user=user).order_by('-date')
        
        logger.info(f"✅ Completed workout saved successfully: {completed_workout.id}")
        return Response({
            'message': 'Workout saved successfully',
            'workout_id': completed_workout.id,
            'workout_progress': CompletedWorkoutSerializer(user_workouts[:10], many=True).data,
            'total_workouts': user_workouts.count()
        })
        
    except Exception as e:
        logger.error(f"❌ Error saving completed workout: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_workout_progress(request):
    """Get user's workout progress history"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        workouts = CompletedWorkout.objects.filter(user=user).order_by('-date')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_workouts = workouts[start:end]
        
        # Calculate stats
        total_workouts = workouts.count()
        total_duration = sum(workout.duration for workout in workouts if workout.duration)
        total_calories = sum(workout.calories_burned for workout in workouts if workout.calories_burned)
        
        # Get workout types distribution
        workout_types = {}
        for workout in workouts:
            workout_type = workout.workout_type or 'Other'
            if workout_type in workout_types:
                workout_types[workout_type] += 1
            else:
                workout_types[workout_type] = 1
        
        progress_data = {
            'workouts': CompletedWorkoutSerializer(paginated_workouts, many=True).data,
            'total_workouts': total_workouts,
            'total_duration': total_duration,
            'total_calories': total_calories,
            'workout_types': workout_types,
            'page': page,
            'page_size': page_size,
            'has_next': end < total_workouts
        }
        
        logger.info(f"📊 Workout progress retrieved for user {user.email}")
        return Response(progress_data)
        
    except Exception as e:
        logger.error(f"❌ Error getting workout progress: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
