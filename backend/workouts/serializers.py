from rest_framework import serializers
from .models import Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutSession, ExerciseSet

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = '__all__'

class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    exercise_id = serializers.PrimaryKeyRelatedField(queryset=Exercise.objects.all(), source='exercise', write_only=True)

    class Meta:
        model = WorkoutExercise
        fields = [
            'id', 'workout_day', 'exercise', 'exercise_id', 'sets', 'reps', 'rest_time', 'weight', 'duration', 'order', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'exercise']

class WorkoutDaySerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutDay
        fields = [
            'id', 'plan', 'name', 'day_number', 'is_rest_day', 'focus_area', 'notes', 'exercises', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'exercises']

class WorkoutPlanSerializer(serializers.ModelSerializer):
    schedule = WorkoutDaySerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = [
            'id', 'name', 'description', 'difficulty', 'duration', 'specific_goal', 'target_gender', 'min_fitness_level', 'is_ai_generated', 'ai_prompt_used', 'created_by', 'is_public', 'created_at', 'updated_at', 'schedule'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'schedule']

class ExerciseSetSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    exercise_id = serializers.PrimaryKeyRelatedField(queryset=Exercise.objects.all(), source='exercise', write_only=True)

    class Meta:
        model = ExerciseSet
        fields = [
            'id', 'session', 'exercise', 'exercise_id', 'set_number', 'reps_completed', 'weight_used', 'duration', 'rest_time', 'notes', 'difficulty_rating', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'exercise']

    def validate(self, attrs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🔍 Validating exercise set data: {attrs}")
        
        # Add default values for required fields if not provided
        if 'set_number' not in attrs:
            attrs['set_number'] = 1
            logger.info(f"📝 Setting default set_number: 1")
        
        if 'reps_completed' not in attrs:
            attrs['reps_completed'] = 0
            logger.info(f"📝 Setting default reps_completed: 0")
        
        logger.info(f"✅ Exercise set validation passed: {attrs}")
        return attrs

class WorkoutSessionSerializer(serializers.ModelSerializer):
    workout_day = WorkoutDaySerializer(read_only=True)
    workout_day_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkoutDay.objects.all(), 
        source='workout_day', 
        write_only=True,
        required=False  # Make it optional
    )
    exercise_sets = ExerciseSetSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'user', 'workout_day', 'workout_day_id', 'status', 'started_at', 'completed_at', 'duration', 'total_exercises', 'completed_exercises', 'notes', 'rating', 'created_at', 'updated_at', 'exercise_sets'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'workout_day', 'exercise_sets', 'user']

    def validate(self, attrs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🔍 Validating workout session data: {attrs}")
        
        # Add default values for required fields if not provided
        if 'status' not in attrs:
            attrs['status'] = 'not_started'
            logger.info(f"📝 Setting default status: not_started")
        
        if 'total_exercises' not in attrs:
            attrs['total_exercises'] = 0
            logger.info(f"📝 Setting default total_exercises: 0")
        
        if 'completed_exercises' not in attrs:
            attrs['completed_exercises'] = 0
            logger.info(f"📝 Setting default completed_exercises: 0")
        
        # If no workout_day_id is provided, that's okay - it's optional now
        if 'workout_day' not in attrs:
            logger.info(f"📝 No workout day provided - this is optional")
        
        logger.info(f"✅ Workout session validation passed: {attrs}")
        return attrs 