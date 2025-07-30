from django.db import models
from users.models import User

class Exercise(models.Model):
    """Exercise database for workout plans"""
    MUSCLE_GROUP_CHOICES = [
        ('chest', 'Chest'),
        ('back', 'Back'),
        ('shoulders', 'Shoulders'),
        ('arms', 'Arms'),
        ('legs', 'Legs'),
        ('core', 'Core'),
        ('cardio', 'Cardio'),
        ('full_body', 'Full Body'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    muscle_group = models.CharField(max_length=20, choices=MUSCLE_GROUP_CHOICES)
    equipment_needed = models.CharField(max_length=200, blank=True)
    difficulty_level = models.CharField(max_length=20, choices=[
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ], default='beginner')
    
    # Exercise instructions
    instructions = models.TextField(blank=True)
    tips = models.TextField(blank=True)
    
    # Media
    image_url = models.URLField(blank=True)
    video_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'exercises'

class WorkoutPlan(models.Model):
    """Workout plan model"""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    DURATION_CHOICES = [
        ('1_month', '1 Month'),
        ('3_month', '3 Months'),
        ('6_month', '6 Months'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='intermediate')
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES, default='1_month')
    
    # Target audience
    specific_goal = models.CharField(max_length=50, blank=True)
    target_gender = models.CharField(max_length=10, choices=User.GENDER_CHOICES, blank=True)
    min_fitness_level = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    
    # AI generation info
    is_ai_generated = models.BooleanField(default=False)
    ai_prompt_used = models.TextField(blank=True)
    
    # Creator info
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_plans')
    is_public = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'workout_plans'

class WorkoutDay(models.Model):
    """Individual day in a workout plan"""
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='schedule')
    name = models.CharField(max_length=200)  # e.g., "Day 1: Chest & Triceps"
    day_number = models.PositiveIntegerField()
    is_rest_day = models.BooleanField(default=False)
    
    # Optional: specific focus for the day
    focus_area = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.plan.name} - {self.name}"
    
    class Meta:
        db_table = 'workout_days'
        ordering = ['day_number']

class WorkoutExercise(models.Model):
    """Exercise within a workout day"""
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    
    # Exercise parameters
    sets = models.PositiveIntegerField(default=3)
    reps = models.PositiveIntegerField(default=10)
    rest_time = models.PositiveIntegerField(default=90)  # in seconds
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)  # in kg
    duration = models.PositiveIntegerField(null=True, blank=True)  # in seconds for timed exercises
    
    # Order in the workout
    order = models.PositiveIntegerField(default=0)
    
    # Notes
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.workout_day.name} - {self.exercise.name}"
    
    class Meta:
        db_table = 'workout_exercises'
        ordering = ['order']

class WorkoutSession(models.Model):
    """Individual workout session tracking"""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sessions')
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    
    # Session tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True)  # in minutes
    
    # Performance tracking
    total_exercises = models.PositiveIntegerField(default=0)
    completed_exercises = models.PositiveIntegerField(default=0)
    
    # Notes
    notes = models.TextField(blank=True)
    rating = models.PositiveIntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.workout_day.name} - {self.status}"
    
    class Meta:
        db_table = 'workout_sessions'

class ExerciseSet(models.Model):
    """Individual set tracking within a workout session"""
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='exercise_sets')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    
    # Set data
    set_number = models.PositiveIntegerField()
    reps_completed = models.PositiveIntegerField()
    weight_used = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True)  # in seconds
    rest_time = models.PositiveIntegerField(null=True, blank=True)  # in seconds
    
    # Performance notes
    notes = models.TextField(blank=True)
    difficulty_rating = models.PositiveIntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.session} - {self.exercise.name} - Set {self.set_number}"
    
    class Meta:
        db_table = 'exercise_sets'
        ordering = ['set_number']
