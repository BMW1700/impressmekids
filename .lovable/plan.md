# Dark-First Homepage

## Goal
Make YubiLearn’s dark appearance the default, predominant presentation while keeping the existing sun/moon control available.

## Changes
- Change the application’s initial appearance from the device-controlled setting to dark.
- Keep an explicit visitor choice persistent: anyone who deliberately switches to light can continue using light mode.
- Preserve the homepage’s existing dark artwork, motion, layout, navigation, and all signed-in pages without redesigning them.
- Check the homepage at phone and desktop sizes to confirm the first load is dark, the appearance switch still works, and returning visitors retain their chosen setting.

## Technical detail
- Update the existing theme provider default from `system` to `dark`; do not force dark on every homepage mount, because that would override the visitor’s saved choice and undermine the switch.
- Validate the current `/` homepage and confirm there are no build or runtime errors.
