import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '../../supabaseClient'
import { Heart } from 'lucide-react';

const LoginPage = () => (
  <div className="w-screen h-screen bg-slate-100 flex justify-center items-center">
    <div className="w-full max-w-md p-4 flex flex-col items-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">LovedOne</h1>
        <p className="text-slate-600">Modern Funeral Management</p>
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
                  brand: 'rgb(30 41 59)',
                  brandAccent: 'rgb(51 65 85)',
                  defaultButtonBackground: 'rgb(30 41 59)',
                  defaultButtonBackgroundHover: 'rgb(51 65 85)',
                  inputBackground: 'white',
                  inputBorder: 'rgb(203 213 225)',
                  inputBorderHover: 'rgb(148 163 184)',
                  inputBorderFocus: 'rgb(148 163 184)',
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
