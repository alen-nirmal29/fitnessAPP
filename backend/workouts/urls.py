from django.urls import path
from . import views

app_name = 'workouts'

urlpatterns = [
    # Exercises
    path('exercises/', views.ExerciseListCreateView.as_view(), name='exercise-list-create'),
    path('exercises/<int:pk>/', views.ExerciseRetrieveUpdateDestroyView.as_view(), name='exercise-detail'),

    # Workout Plans
    path('plans/', views.WorkoutPlanListCreateView.as_view(), name='plan-list-create'),
    path('plans/<int:pk>/', views.WorkoutPlanRetrieveUpdateDestroyView.as_view(), name='plan-detail'),

    # Workout Days
    path('days/', views.WorkoutDayListCreateView.as_view(), name='day-list-create'),
    path('days/<int:pk>/', views.WorkoutDayRetrieveUpdateDestroyView.as_view(), name='day-detail'),

    # Workout Sessions
    path('sessions/', views.WorkoutSessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<int:pk>/', views.WorkoutSessionRetrieveUpdateDestroyView.as_view(), name='session-detail'),

    # Exercise Sets
    path('sets/', views.ExerciseSetListCreateView.as_view(), name='set-list-create'),
    path('sets/<int:pk>/', views.ExerciseSetRetrieveUpdateDestroyView.as_view(), name='set-detail'),
] 