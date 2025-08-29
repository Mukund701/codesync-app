import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: '#09090B', // A dark background matching your theme
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          border: '1px solid #27272A', // A subtle border
        }}
      >
        {/* This is our new, unique SVG logo inspired by your selection.
          It's a geometric monogram representing "CS" for CodeSync.
        */}
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          strokeWidth="3" // A thick, bold stroke
          stroke="#E4E4E7" // A bright, off-white color for high contrast
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* This path creates a stylized 'C' shape, like an open bracket */}
          <path d="M15 20H9C6.23858 20 4 17.7614 4 15V9C4 6.23858 6.23858 4 9 4H15" />
          {/* This path creates a stylized 'S' shape, like a sync or data flow path */}
          <path d="M12 8L20 8" />
          <path d="M12 16L20 16" />
          <path d="M16 8L16 12L12 12" />
          <path d="M16 16L16 12L20 12" />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}

