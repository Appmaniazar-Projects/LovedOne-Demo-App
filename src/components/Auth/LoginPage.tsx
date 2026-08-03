import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '../../supabaseClient'
import LovedOneLogo from '../../assets/LovedOne_Logo_black.png';

const LoginPage = () => (
  <div className="w-screen h-screen bg-slate-100 flex justify-center items-center">
    <div className="w-full max-w-md p-4 flex flex-col items-center">
      <div className="mb-8 flex flex-col items-center">
        <img
          src={LovedOneLogo}
          alt="LovedOne logo"
          className="w-50 h-50 mb-4 object-contain"
        />
        <p className="text-slate-600">Compassionate tech for life's hardest moments</p>
      </div>
      <div className="w-full">
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          showLinks={false}
          appearance={{
            theme: {
              default: {
                colors: {
                  brand: '#FAFAFA',
                  brandAccent: '#1A867F',

                  defaultButtonBackground: '#FAFAFA',
                  defaultButtonBackgroundHover: '#1A867F',
                  defaultButtonText: '#FFFFFF',

                  inputBackground: '#FFFFFF',
                  inputBorder: '#CBD5E1',
                  inputBorderHover: '#94A3B8',
                  inputBorderFocus: '#0F766E',
                },
                space: {
                  spaceSmall: '4px',
                  spaceMedium: '8px',
                  spaceLarge: '16px',
                  labelBottomMargin: '8px',
                  anchorBottomMargin: '4px',
                  emailInputSpacing: '4px',
                  socialAuthSpacing: '4px',
                  buttonPadding: '10px 15px',
                  inputPadding: '10px 15px',
                },
                fontSizes: {
                  baseBodySize: '14px',
                  baseInputSize: '14px',
                  baseLabelSize: '14px',
                  baseButtonSize: '14px',
                },
                fonts: {
                  bodyFontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
                  buttonFontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
                  inputFontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
                  labelFontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
                },
              },
            },
          }}
          providers={[]}
          socialLayout="horizontal"
        />
      </div>
    </div>
  </div>
)

export default LoginPage
