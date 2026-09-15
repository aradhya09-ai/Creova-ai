export const backends = [
  { id: 'huggingface', label: 'Hugging Face' },
  { id: 'local', label: 'Local model' },
  { id: 'local_endpoint', label: 'Compatible endpoint' },
]

export const imageStyles = [
  'Cinematic', 'Realistic', 'Anime', '3D', 'Illustration',
  'Fashion', 'Fantasy', 'Cyberpunk', 'Minimal', 'Photography',
]

export const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4']
export const resolutions = [512, 768, 1024]
export const seedOptions = ['random']

export const videoDurations = [5, 10, 15]
export const videoAspects = ['16:9', '9:16', '1:1']
export const videoStyles = [
  'Cinematic', 'Realistic', 'Anime', 'Fantasy', 'Sci-fi', 'Documentary', 'Commercial',
]
export const cameras = ['Static', 'Dolly in', 'Dolly out', 'Pan', 'Tracking', 'Orbit']

export const voiceStyles = [
  'Natural', 'Cinematic', 'Calm', 'Energetic', 'Professional', 'Storytelling', 'Friendly',
]
export const emotions = ['Happy', 'Sad', 'Excited', 'Calm', 'Serious', 'Dramatic']
export const genders = ['Female', 'Male', 'Neutral']

export const cardTemplates = [
  'Motivation', 'Birthday', 'Love', 'Friendship', 'Study', 'Career',
  'Startup', 'Productivity', 'Instagram Post', 'Pinterest', 'Quote Card',
  'Certificate', 'Thank You',
]

export const systemRoutes = [
  { path: '/home', label: 'Home', icon: 'Home' },
  { path: '/create', label: 'Create', icon: 'Sparkles' },
  { path: '/images', label: 'Image Generator', icon: 'Image' },
  { path: '/videos', label: 'Video Generator', icon: 'Video' },
  { path: '/voice', label: 'Voice Studio', icon: 'Mic' },
  { path: '/cards', label: 'AI Cards', icon: 'Kernel' },
  { path: '/projects', label: 'Projects', icon: 'Folder' },
  { path: '/history', label: 'History', icon: 'Clock' },
  { path: '/downloads', label: 'Downloads', icon: 'Download' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
]