import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { createEvent, supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-solid';
import { ThemeSupa } from '@supabase/auth-ui-shared';

function App() {
  const [user, setUser] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal('login');
  const [loading, setLoading] = createSignal(false);
  const [textInput, setTextInput] = createSignal('');
  const [audioUrl, setAudioUrl] = createSignal('');
  const [generatedJoke, setGeneratedJoke] = createSignal('');

  const checkUserSignedIn = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setCurrentPage('homePage');
    }
  };

  onMount(checkUserSignedIn);

  createEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentPage('homePage');
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('login');
  };

  const handleReadAloud = async () => {
    if (!textInput()) return;
    setLoading(true);
    try {
      const audio = await createEvent('text_to_speech', {
        text: textInput(),
      });
      setAudioUrl(audio);
      // Automatically play the audio
      const audioElement = new Audio(audio);
      audioElement.play();
    } catch (error) {
      console.error('Error converting text to speech:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndReadJoke = async () => {
    setLoading(true);
    try {
      const joke = await createEvent('chatgpt_request', {
        prompt:
          'اخبرني نكتة قصيرة ومضحكة باللغة العربية في شكل نص فقط بدون أي تنسيق إضافي.',
        response_type: 'text',
      });
      setGeneratedJoke(joke);
      const audio = await createEvent('text_to_speech', {
        text: joke,
      });
      setAudioUrl(audio);
      // Automatically play the audio
      const audioElement = new Audio(audio);
      audioElement.play();
    } catch (error) {
      console.error('Error generating joke:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="h-full bg-gradient-to-br from-gray-100 to-gray-200 p-4 text-gray-800">
      <Show
        when={currentPage() === 'homePage'}
        fallback={
          <div class="flex items-center justify-center h-full">
            <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
              <h2 class="text-3xl font-bold mb-6 text-center text-blue-600">
                تسجيل الدخول باستخدام ZAPT
              </h2>
              <a
                href="https://www.zapt.ai"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline mb-6 block text-center"
              >
                تعرف على المزيد حول ZAPT
              </a>
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google', 'facebook', 'apple']}
                magicLink={true}
                showLinks={false}
                view="magic_link"
              />
            </div>
          </div>
        }
      >
        <div class="max-w-3xl mx-auto h-full flex flex-col">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-blue-600">مساعد الكفيف</h1>
            <button
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
              onClick={handleSignOut}
            >
              تسجيل الخروج
            </button>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md flex-1 flex flex-col">
            <h2 class="text-2xl font-bold mb-4 text-blue-600">إدخال النص</h2>
            <textarea
              placeholder="اكتب النص هنا..."
              value={textInput()}
              onInput={(e) => setTextInput(e.target.value)}
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent box-border mb-4 flex-1 resize-none"
              rows="5"
            ></textarea>
            <div class="flex space-x-4 mt-4">
              <button
                class={`flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
                  loading() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleReadAloud}
                disabled={loading()}
              >
                <Show when={loading() && !generatedJoke()}>
                  جارٍ القراءة...
                </Show>
                <Show when={!loading() || generatedJoke()}>اقرأ النص</Show>
              </button>
              <button
                class={`flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
                  loading() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleGenerateAndReadJoke}
                disabled={loading()}
              >
                <Show when={loading() && !generatedJoke()}>
                  جارٍ توليد النكتة...
                </Show>
                <Show when={!loading() || generatedJoke()}>
                  توليد نكتة
                </Show>
              </button>
            </div>
          </div>

          <Show when={generatedJoke()}>
            <div class="bg-white p-6 rounded-lg shadow-md mt-6">
              <h2 class="text-2xl font-bold mb-4 text-blue-600">
                النكتة المولدة
              </h2>
              <p class="text-gray-800 text-lg">{generatedJoke()}</p>
            </div>
          </Show>

          <Show when={audioUrl()}>
            <div class="bg-white p-6 rounded-lg shadow-md mt-6">
              <h2 class="text-2xl font-bold mb-4 text-blue-600">الصوت</h2>
              <audio controls src={audioUrl()} class="w-full" />
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

export default App;