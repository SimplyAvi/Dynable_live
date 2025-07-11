# Environment Setup Guide

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dynable_new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001 (if running)

---

## Device Compatibility & Mobile Fixes

### ✅ **Supported Devices & Optimizations**

#### **iOS Devices (iPhone, iPad)**
- **Touch Handling**: Enhanced touch events with `onTouchStart` and `onClick`
- **Smooth Scrolling**: `-webkit-overflow-scrolling: touch` for horizontal allergen scrolling
- **Tap Highlights**: Removed with `-webkit-tap-highlight-color: transparent`
- **Font Sizing**: 16px minimum to prevent zoom on input fields
- **Touch Targets**: Minimum 44px for reliable tapping

#### **Android Devices**
- **Touch Optimization**: `touch-action: manipulation` for better touch response
- **Android-Specific CSS**: `@media screen and (-webkit-min-device-pixel-ratio: 0)`
- **Tap Feedback**: Subtle tap highlight for better user feedback
- **Touch Callouts**: Disabled to prevent unwanted interactions

#### **Tablet Devices (768px - 1024px)**
- **Responsive Breakpoints**: Specific tablet optimizations
- **Larger Touch Targets**: Increased button sizes for tablet interaction
- **Optimized Layouts**: Better use of tablet screen real estate
- **Font Scaling**: Appropriate text sizes for tablet viewing

#### **Small Mobile Devices (< 480px)**
- **Compact Layouts**: Optimized for very small screens
- **Reduced Padding**: Tighter spacing for small devices
- **Smaller Fonts**: Appropriate text scaling
- **Touch-Friendly**: Maintained minimum touch target sizes

#### **Medium Mobile Devices (480px - 768px)**
- **Balanced Design**: Optimal balance between usability and aesthetics
- **Standard Touch Targets**: 44px minimum for reliable interaction
- **Responsive Typography**: Scalable text that works across devices

### 🔧 **Component-Specific Fixes**

#### **Allergen Filter**
- **Larger Touch Targets**: Increased from 40px to 50px (desktop) and 60px (mobile)
- **Enhanced Touch Events**: Added `onTouchStart` alongside `onClick`
- **Mobile Scrolling**: Improved horizontal scroll behavior
- **iOS/Android Support**: Platform-specific optimizations

#### **Search Bar**
- **Zoom Prevention**: 16px font size to prevent iOS zoom
- **Touch Optimization**: `touch-action: manipulation`
- **Responsive Sizing**: Adapts to different screen sizes
- **Better Input Handling**: Improved mobile keyboard interaction

#### **Product Cards**
- **Touch Feedback**: Active state scaling for touch devices
- **Responsive Images**: Optimized image heights for different screens
- **Touch-Friendly**: Larger touch targets and better spacing
- **Hover Disabled**: Disabled hover effects on touch devices

#### **Navigation Buttons**
- **Mobile Stacking**: Vertical layout on small screens
- **Touch Targets**: Minimum 44px for reliable tapping
- **Visual Feedback**: Clear active states and transitions
- **Accessibility**: Proper ARIA labels and keyboard navigation

### 🚨 **Known Issues & Solutions**

#### **iPhone 12 Inspection Mode**
- **Issue**: Allergen filtering may not work properly
- **Solution**: Enhanced touch event handling and larger touch targets
- **Status**: ✅ Fixed with comprehensive mobile optimizations

#### **Android Touch Delays**
- **Issue**: Slight delay in touch response
- **Solution**: Added `touch-action: manipulation` and optimized event handling
- **Status**: ✅ Improved with Android-specific CSS

#### **Tablet Layout Issues**
- **Issue**: Suboptimal layouts on tablet devices
- **Solution**: Added tablet-specific breakpoints (768px-1024px)
- **Status**: ✅ Fixed with responsive design improvements

#### **Small Screen Cramping**
- **Issue**: Elements too cramped on very small screens
- **Solution**: Added 480px breakpoint with compact layouts
- **Status**: ✅ Fixed with small device optimizations

### 📱 **Testing Recommendations**

#### **Device Testing Checklist**
- [ ] iPhone (various models) - Touch interaction
- [ ] iPad - Tablet layout and touch
- [ ] Android phones - Touch response and layout
- [ ] Android tablets - Tablet-specific features
- [ ] Small mobile devices (< 480px) - Compact layouts
- [ ] Desktop browsers - Full functionality

#### **Key Test Scenarios**
1. **Allergen Filter**: Tap each allergen button, verify selection
2. **Search Function**: Type in search bar, test on-screen keyboard
3. **Product Cards**: Tap cards, verify navigation and cart addition
4. **Navigation**: Test all buttons and links
5. **Scrolling**: Test horizontal allergen scrolling
6. **Responsive Layout**: Rotate device, test layout changes

### 🛠 **Technical Implementation**

#### **CSS Touch Properties**
```css
/* Touch optimization */
touch-action: manipulation;
-webkit-tap-highlight-color: transparent;
-webkit-touch-callout: none;
-webkit-user-select: none;
```

#### **JavaScript Touch Events**
```javascript
// Enhanced touch handling
onClick={(e) => handleInteraction(key, e)}
onTouchStart={(e) => handleInteraction(key, e)}
```

#### **Responsive Breakpoints**
```css
/* Mobile */
@media (max-width: 768px) { ... }

/* Small mobile */
@media (max-width: 480px) { ... }

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) { ... }
```

---

## Backend Setup (Optional)

### Database Configuration
1. **Install PostgreSQL**
2. **Create database**: `dynable_db`
3. **Run migrations**: `npm run migrate`
4. **Seed data**: `npm run seed`

### API Server
1. **Navigate to server directory**: `cd server`
2. **Install dependencies**: `npm install`
3. **Start server**: `npm start`
4. **Verify**: http://localhost:5001/api/health

---

## Troubleshooting

### Common Issues

#### **Allergen Scroller Not Visible**
1. Check browser console for API errors
2. Ensure backend is running (if using full features)
3. Check network connectivity
4. Verify environment variables are set correctly

#### **API Connection Issues**
1. Verify backend server is running on correct port
2. Check firewall settings
3. Ensure CORS is properly configured
4. Try fallback mode if backend unavailable

#### **Mobile Touch Issues**
1. Clear browser cache and cookies
2. Test on different mobile devices
3. Check for JavaScript errors in console
4. Verify touch event handlers are working

#### **Responsive Layout Problems**
1. Test on actual devices (not just browser dev tools)
2. Check CSS media queries are correct
3. Verify viewport meta tag is present
4. Test different screen orientations

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5001` |
| `NODE_ENV` | Environment mode | `development` |

---

## Fallback Behavior

The application gracefully handles missing backend services:
- Shows basic allergen list instead of empty scroller
- Logs helpful error messages to console
- Maintains core functionality
- Provides clear feedback about connection status

---

**For all data mapping, audit, and normalization questions, see `server/DATA_METHODS_AND_IMPLEMENTATION.md`.** 