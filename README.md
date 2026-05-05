# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Supabase Blog Admin

Blog posts can be served from Supabase with a lightweight `/admin` manager. The public site uses the anon key for read-only published posts. Admin writes and post management go through the `admin-blog-post` Supabase Edge Function, which checks `ADMIN_POST_SECRET` server-side before listing, inserting, or updating posts and media.

### Local app env

Create `.env.local` from `.env.example`:

```bash
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-public-anon-key
```

If these values are missing, the app falls back to the local posts in `src/data/blogPosts.js`.

### Supabase setup

Run the migration in `supabase/migrations/20260505000000_create_blog_posts.sql` with the Supabase CLI or paste it into the Supabase SQL editor. It creates:

- `public.ajt3_blog_posts` with RLS enabled
- a public-read policy for published posts
- a public `blog-media` storage bucket for uploaded photos and videos

Uploads are stored under a namespaced directory in the bucket. By default, this site writes media to:

```text
blog-media/ajt3/me/blog/{title-slug}/...
```

Deploy the Edge Function:

```bash
supabase functions deploy admin-blog-post
```

Set the admin secret:

```bash
supabase secrets set ADMIN_POST_SECRET="use-a-long-random-password"
```

Optional bucket path override:

```bash
supabase secrets set BLOG_MEDIA_PREFIX="ajt3/me/blog"
```

Optional production CORS lock:

```bash
supabase secrets set ADMIN_CORS_ORIGIN="https://your-domain.com"
```

After deployment, visit `/admin`, enter the shared admin secret on the access screen, then manage existing posts or create new standardized posts with a cover image, content sections, and photo/video media. Blog URLs are generated from the title.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
