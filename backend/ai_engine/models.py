from django.db import models
from users.models import User
from workouts.models import WorkoutPlan

class AIRequest(models.Model):
    """Track AI requests for workout plan generation"""
    REQUEST_TYPE_CHOICES = [
        ('workout_plan', 'Workout Plan Generation'),
        ('recommendation', 'Workout Recommendation'),
        ('exercise_suggestion', 'Exercise Suggestion'),
        ('progress_analysis', 'Progress Analysis'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_requests')
    
    # Request details
    request_type = models.CharField(max_length=30, choices=REQUEST_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # AI prompt and context
    prompt = models.TextField()
    user_context = models.JSONField(default=dict)  # User profile data sent to AI
    
    # Response data
    ai_response = models.JSONField(default=dict, null=True, blank=True)
    generated_plan = models.ForeignKey(WorkoutPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_generated_plan')
    
    # Performance tracking
    tokens_used = models.PositiveIntegerField(null=True, blank=True)
    processing_time = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)  # in seconds
    cost = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)  # in USD
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.request_type} - {self.status}"
    
    class Meta:
        db_table = 'ai_requests'
        ordering = ['-created_at']

class AIRecommendation(models.Model):
    """AI-generated workout recommendations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    
    # Recommendation details
    title = models.CharField(max_length=200)
    description = models.TextField()
    reasoning = models.TextField()  # Why this recommendation was made
    
    # Recommendation type
    recommendation_type = models.CharField(max_length=50, choices=[
        ('workout_plan', 'Workout Plan'),
        ('exercise', 'Exercise'),
        ('nutrition', 'Nutrition'),
        ('lifestyle', 'Lifestyle'),
        ('recovery', 'Recovery'),
    ])
    
    # Priority and relevance
    priority = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ], default='medium')
    
    relevance_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)  # 0-1
    
    # User interaction
    is_read = models.BooleanField(default=False)
    is_applied = models.BooleanField(default=False)
    user_feedback = models.CharField(max_length=20, choices=[
        ('helpful', 'Helpful'),
        ('not_helpful', 'Not Helpful'),
        ('neutral', 'Neutral'),
    ], null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    class Meta:
        db_table = 'ai_recommendations'
        ordering = ['-created_at']

class AITrainingData(models.Model):
    """Training data for improving AI recommendations"""
    DATA_TYPE_CHOICES = [
        ('user_feedback', 'User Feedback'),
        ('workout_completion', 'Workout Completion'),
        ('progress_data', 'Progress Data'),
        ('user_preference', 'User Preference'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_training_data')
    
    # Data details
    data_type = models.CharField(max_length=30, choices=DATA_TYPE_CHOICES)
    data_content = models.JSONField()  # Structured data for training
    
    # Context
    user_profile_snapshot = models.JSONField(default=dict)  # User state when data was collected
    ai_request_id = models.ForeignKey(AIRequest, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Quality metrics
    data_quality_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    is_used_for_training = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.data_type} - {self.created_at.date()}"
    
    class Meta:
        db_table = 'ai_training_data'
        ordering = ['-created_at']

class AIModelVersion(models.Model):
    """Track different versions of AI models used"""
    MODEL_TYPE_CHOICES = [
        ('workout_generator', 'Workout Plan Generator'),
        ('recommendation_engine', 'Recommendation Engine'),
        ('progress_analyzer', 'Progress Analyzer'),
    ]
    
    model_type = models.CharField(max_length=30, choices=MODEL_TYPE_CHOICES)
    version = models.CharField(max_length=20)
    model_name = models.CharField(max_length=100)  # e.g., "gpt-4", "claude-3"
    
    # Performance metrics
    accuracy_score = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    user_satisfaction_score = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    
    # Usage statistics
    total_requests = models.PositiveIntegerField(default=0)
    successful_requests = models.PositiveIntegerField(default=0)
    average_response_time = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    
    # Configuration
    is_active = models.BooleanField(default=True)
    configuration = models.JSONField(default=dict)  # Model-specific settings
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.model_type} - v{self.version}"
    
    class Meta:
        db_table = 'ai_model_versions'
        ordering = ['-created_at']
        unique_together = ['model_type', 'version']
