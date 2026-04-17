### Purpose of this PR

This pull request adds **user avatar upload support** to the profile settings page. Users can now upload, crop, and remove their profile picture directly from the UI.

---

### Summary of Changes

#### Primary changes

- Added avatar upload component with drag-and-drop and file picker support
- Implemented client-side image cropping before upload
- Integrated with the existing file storage API endpoint
- Added loading and error states for upload feedback
- Updated profile settings layout to display the new avatar section

#### Supporting changes

- Bumped `image-crop` package from 2.1.0 to 3.0.1 to fix a cropping bug on Safari
- Added `public/uploads/` to `.gitignore` (generated during local dev)
