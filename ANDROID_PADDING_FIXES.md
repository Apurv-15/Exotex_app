# Android Padding Fixes Applied

## Issue
Double headers appearing on Android due to status bar not being accounted for in padding calculations.

## Solution
Updated all screens to use `StatusBar.currentHeight` for Android padding calculations.

## Files Modified
1. `src/screens/fieldvisit/FieldVisitForm.tsx` - ✅ Fixed
   - Added StatusBar import
   - Updated header paddingTop: `Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20`

## Other Screens Checked
- CreateSaleStep1 - Uses ScrollView with contentContainerStyle (no fixed header)
- CreateSaleStep2 - Uses ScrollView with contentContainerStyle (no fixed header)  
- MainBranchDashboard - Uses ScrollView (no fixed header issue)
- SubBranchDashboard - Uses ScrollView (no fixed header issue)
- LoginScreen - No header padding issue

## Testing Checklist
- [ ] Field Visit Form - header aligned properly on Android
- [ ] All screens - no double headers visible
- [ ] Status bar text readable on all screens
