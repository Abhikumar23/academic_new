import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { useSelector } from "react-redux";

export default function ChipInput({
  label,
  name,
  placeholder,
  register,
  errors,
  setValue,
  getValues,
}) {
  const { editCourse, course } = useSelector((state) => state.course);
  const [chips, setChips] = useState([]);

  useEffect(() => {
    if (editCourse) {
      setChips(course?.tag || []);
    }
    register(name, { 
      required: true, 
      validate: (value) => value.length > 0 
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setValue(name, chips);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chips]);

  // Handle key down event for Enter key
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const chipValue = event.target.value.trim();
      
      if (chipValue && !chips.includes(chipValue)) {
        setChips([...chips, chipValue]);
        event.target.value = "";
      }
    }
  };

  // Handle chip deletion
  const handleDeleteChip = (chipIndex) => {
    const newChips = chips.filter((_, index) => index !== chipIndex);
    setChips(newChips);
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-richblack-5" htmlFor={name}>
        {label} <sup className="text-pink-200">*</sup>
      </label>

      {/* Display chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-full bg-yellow-400 px-2 py-1 text-sm text-richblack-5"
          >
            {chip}
            <button
              type="button"
              onClick={() => handleDeleteChip(index)}
              className="focus:outline-none"
            >
              <MdClose className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      {/* Input field */}
      <input
        id={name}
        name={name}
        type="text"
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        className="form-style w-full"
      />

      {errors[name] && (
        <span className="ml-2 text-xs tracking-wide text-pink-200">
          {label} is required
        </span>
      )}
    </div>
  );
}