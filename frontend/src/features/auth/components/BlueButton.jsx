import React from 'react'

const BlueButton = ({btnTitle}) => {
  return (
    <button className='px-5 rounded-full py-3 mt-2 bg-blue-500 text-white active:bg-blue-600'>
        {btnTitle}
    </button>
  )
}

export default BlueButton