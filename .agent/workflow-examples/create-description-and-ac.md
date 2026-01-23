**Description**

This feature handles the **display and playback of surgery videos** within the **Patient Form** of the **Research Center**, ensuring a stable and consistent viewing experience across inline and fullscreen modes.

**Acceptance Criteria**

- **AC1**: Given the user opens the Patient Form, when the Surgery Resources section is rendered, then it displays two tabs: **Video** and **Report**.
- **AC2**: Given the Video tab is active, when the content is displayed, then videos are shown in a **single-column layout** according to the Figma design, including the defined **empty state**.
- **AC3**: Given a video item is available, when the user interacts with it, then the video can be played both **inline** and in **fullscreen** mode.
- **AC4**: Given a video is played inline, when playback controls are shown, then only the **fullscreen** icon is visible and the **playback-rate** icon is hidden.
- **AC5**: Given a video is playing inline, when the user starts playing another video, then all other currently playing videos are **automatically paused**.
- **AC6**: Given a video transitions between **inline** and **fullscreen** modes, when the transition occurs, then the **play/pause state and timeline position remain synchronized**; a playing video continues playing at the same position, and a paused video remains paused.
- **AC7**: Given a video is playing inline or fullscreen, when the user switches to another tab or navigates to a different page, then the application remains **stable** with no crashes or playback-related issues.
