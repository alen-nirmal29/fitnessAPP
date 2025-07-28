#!/usr/bin/env python
"""
Script to delete all existing users from the database.
Run this script to clear all user data and start fresh.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_project.settings')
django.setup()

from users.models import User, BodyComposition, BodyMeasurements, GoalMeasurements
from workouts.models import WorkoutSession, ExerciseSet
from progress.models import ProgressEntry, WorkoutProgress, Goal, Analytics

def delete_all_users():
    """Delete all users and related data"""
    print("Starting user deletion process...")
    
    # Count existing users
    user_count = User.objects.count()
    print(f"Found {user_count} existing users")
    
    if user_count == 0:
        print("No users to delete.")
        return
    
    # Delete related data first (due to foreign key constraints)
    print("Deleting related data...")
    
    # Delete workout sessions and sets
    session_count = WorkoutSession.objects.count()
    set_count = ExerciseSet.objects.count()
    WorkoutSession.objects.all().delete()
    ExerciseSet.objects.all().delete()
    print(f"Deleted {session_count} workout sessions and {set_count} exercise sets")
    
    # Delete progress data
    progress_count = ProgressEntry.objects.count()
    workout_progress_count = WorkoutProgress.objects.count()
    goal_count = Goal.objects.count()
    analytics_count = Analytics.objects.count()
    ProgressEntry.objects.all().delete()
    WorkoutProgress.objects.all().delete()
    Goal.objects.all().delete()
    Analytics.objects.all().delete()
    print(f"Deleted {progress_count} progress entries, {workout_progress_count} workout progress records, {goal_count} goals, and {analytics_count} analytics records")
    
    # Delete body data
    composition_count = BodyComposition.objects.count()
    measurements_count = BodyMeasurements.objects.count()
    goal_measurements_count = GoalMeasurements.objects.count()
    BodyComposition.objects.all().delete()
    BodyMeasurements.objects.all().delete()
    GoalMeasurements.objects.all().delete()
    print(f"Deleted {composition_count} body compositions, {measurements_count} body measurements, and {goal_measurements_count} goal measurements")
    
    # Finally, delete all users
    User.objects.all().delete()
    print(f"Deleted all {user_count} users")
    
    # Verify deletion
    remaining_users = User.objects.count()
    print(f"Remaining users: {remaining_users}")
    
    if remaining_users == 0:
        print("✅ All users and related data have been successfully deleted!")
    else:
        print("❌ Some users still remain. Please check manually.")

if __name__ == '__main__':
    # Ask for confirmation
    response = input("This will delete ALL users and their data. Are you sure? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        delete_all_users()
    else:
        print("Operation cancelled.") 