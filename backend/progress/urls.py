from django.urls import path
from . import views

app_name = 'progress'

urlpatterns = [
    # Progress Entries
    path('entries/', views.ProgressEntryListCreateView.as_view(), name='entry-list-create'),
    path('entries/<int:pk>/', views.ProgressEntryRetrieveUpdateDestroyView.as_view(), name='entry-detail'),

    # Workout Progress
    path('workout/', views.WorkoutProgressListCreateView.as_view(), name='workoutprogress-list-create'),
    path('workout/<int:pk>/', views.WorkoutProgressRetrieveUpdateDestroyView.as_view(), name='workoutprogress-detail'),

    # Goals
    path('goals/', views.GoalListCreateView.as_view(), name='goal-list-create'),
    path('goals/<int:pk>/', views.GoalRetrieveUpdateDestroyView.as_view(), name='goal-detail'),

    # Analytics
    path('analytics/', views.AnalyticsListCreateView.as_view(), name='analytics-list-create'),
    path('analytics/<int:pk>/', views.AnalyticsRetrieveUpdateDestroyView.as_view(), name='analytics-detail'),
] 