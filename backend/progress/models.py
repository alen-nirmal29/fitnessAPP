from django.db import models
from users.models import User, BodyMeasurements, BodyComposition

class CompletedWorkout(models.Model):
    """Model for tracking individual completed workouts"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='completed_workouts')
    
    # Workout details
    workout_name = models.CharField(max_length=200)
    workout_type = models.CharField(max_length=50, blank=True)  # e.g., "strength", "cardio", "hiit"
    
    # Timing
    date = models.DateField()
    duration = models.PositiveIntegerField()  # in minutes
    
    # Performance metrics
    calories_burned = models.PositiveIntegerField(default=0)
    exercises_completed = models.PositiveIntegerField(default=0)
    
    # Optional details
    notes = models.TextField(blank=True)
    rating = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5 rating
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.workout_name} - {self.date}"
    
    class Meta:
        db_table = 'completed_workouts'
        ordering = ['-date']

class ProgressEntry(models.Model):
    """Individual progress entry for tracking user progress over time"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_entries')
    
    # Date of measurement
    date = models.DateField()
    
    # Weight tracking
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # kg
    
    # Body measurements (optional - can be partial)
    chest = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    neck = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    waist = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    left_arm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    right_arm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    left_thigh = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    right_thigh = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    shoulders = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    hips = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    calves = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Body composition (optional)
    body_fat = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    muscle_mass = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bmi = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Progress photos
    front_photo = models.ImageField(upload_to='progress_photos/front/', null=True, blank=True)
    back_photo = models.ImageField(upload_to='progress_photos/back/', null=True, blank=True)
    side_photo = models.ImageField(upload_to='progress_photos/side/', null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.date}"
    
    class Meta:
        db_table = 'progress_entries'
        ordering = ['-date']
        unique_together = ['user', 'date']

class WorkoutProgress(models.Model):
    """Progress tracking for specific workout plans"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_progress')
    
    # Plan tracking
    plan_name = models.CharField(max_length=200)
    plan_duration = models.CharField(max_length=20)  # e.g., "30 days", "3 months"
    
    # Progress metrics
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    current_day = models.PositiveIntegerField(default=1)
    total_days = models.PositiveIntegerField()
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # 0-100
    
    # Performance tracking
    workouts_completed = models.PositiveIntegerField(default=0)
    total_workout_time = models.PositiveIntegerField(default=0)  # in minutes
    average_workout_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.plan_name} ({self.completion_percentage}%)"
    
    class Meta:
        db_table = 'workout_progress'

class Goal(models.Model):
    """User fitness goals and targets"""
    GOAL_TYPE_CHOICES = [
        ('weight', 'Weight Goal'),
        ('measurement', 'Measurement Goal'),
        ('strength', 'Strength Goal'),
        ('endurance', 'Endurance Goal'),
        ('body_composition', 'Body Composition Goal'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    
    # Goal details
    title = models.CharField(max_length=200)
    description = models.TextField()
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPE_CHOICES)
    
    # Target values
    target_value = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    target_date = models.DateField()
    
    # Current progress
    current_value = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_achieved = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    achieved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    class Meta:
        db_table = 'goals'
        ordering = ['-created_at']

class Analytics(models.Model):
    """Analytics data for user progress visualization"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics')
    
    # Time period
    period_start = models.DateField()
    period_end = models.DateField()
    period_type = models.CharField(max_length=20, choices=[
        ('week', 'Week'),
        ('month', 'Month'),
        ('quarter', 'Quarter'),
        ('year', 'Year'),
    ])
    
    # Weight analytics
    starting_weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    ending_weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight_change = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Body composition analytics
    starting_body_fat = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    ending_body_fat = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    body_fat_change = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Workout analytics
    total_workouts = models.PositiveIntegerField(default=0)
    total_workout_time = models.PositiveIntegerField(default=0)  # minutes
    average_workout_duration = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    average_workout_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    
    # Consistency metrics
    workout_consistency = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage
    days_worked_out = models.PositiveIntegerField(default=0)
    total_days = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.period_start} to {self.period_end}"
    
    class Meta:
        db_table = 'analytics'
        ordering = ['-period_start']
        unique_together = ['user', 'period_start', 'period_end', 'period_type']
