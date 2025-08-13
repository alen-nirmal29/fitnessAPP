from rest_framework import serializers
from .models import ProgressEntry, WorkoutProgress, Goal, Analytics, CompletedWorkout

class ProgressEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressEntry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

class WorkoutProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutProgress
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

class AnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analytics
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

class CompletedWorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompletedWorkout
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']