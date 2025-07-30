from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutSession, ExerciseSet
from .serializers import (
    ExerciseSerializer, WorkoutPlanSerializer, WorkoutDaySerializer,
    WorkoutExerciseSerializer, WorkoutSessionSerializer, ExerciseSetSerializer
)

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
