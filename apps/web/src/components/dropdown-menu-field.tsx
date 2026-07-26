import { type FocusEvent, type KeyboardEvent, useRef, useState } from 'react';
import { classNames } from '../lib/class-names.js';

export interface DropdownMenuOption {
  label: string;
  value: string;
}

interface DropdownMenuFieldProps {
  id: string;
  label: string;
  onValueChange: (value: string) => void;
  options: readonly DropdownMenuOption[];
  value: string;
}

export function DropdownMenuField({ id, label, onValueChange, options, value }: DropdownMenuFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const labelId = `${id}-label`;
  const menuId = `${id}-menu`;
  const valueId = `${id}-value`;

  function getMenuItems(): HTMLButtonElement[] {
    return Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
  }

  function focusSelectedItem() {
    const menuItems = getMenuItems();
    const selectedItem = menuItems.find((item) => item.dataset.value === value) ?? menuItems[0];
    selectedItem?.focus();
  }

  function openMenu(focusLastItem = false) {
    setIsOpen(true);
    requestAnimationFrame(() => {
      const menuItems = getMenuItems();

      if (focusLastItem) {
        menuItems.at(-1)?.focus();
        return;
      }

      focusSelectedItem();
    });
  }

  function closeMenu() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerClick() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    openMenu();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu();
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(true);
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const menuItems = getMenuItems();
    const activeElement = document.activeElement;
    const activeIndex = activeElement instanceof HTMLButtonElement ? menuItems.indexOf(activeElement) : -1;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      menuItems[0]?.focus();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      menuItems.at(-1)?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      menuItems[(activeIndex + 1) % menuItems.length]?.focus();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      menuItems[(activeIndex - 1 + menuItems.length) % menuItems.length]?.focus();
    }
  }

  function handleBlur(event: FocusEvent<HTMLFieldSetElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  }

  return (
    <fieldset className="grid min-w-0 gap-2 border-0 p-0" onBlur={handleBlur}>
      <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b92a1]" id={labelId}>
        {label}
      </legend>
      <div className="relative">
        <button
          aria-controls={menuId}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-labelledby={`${labelId} ${valueId}`}
          className={classNames(
            'flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-[9px] border bg-[#1f232b] px-3 py-2 text-left text-[13px] font-medium text-[#eef0f4] outline-none transition-colors',
            isOpen
              ? 'border-[#5fdf9b] ring-2 ring-[#5fdf9b]/30'
              : 'border-white/10 hover:border-white/20 hover:bg-[#23272f] focus-visible:border-[#5fdf9b] focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/30',
          )}
          id={id}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          ref={triggerRef}
          type="button"
        >
          <span className="truncate" id={valueId}>
            {selectedOption?.label}
          </span>
          <ChevronDownIcon
            className={classNames('size-4 shrink-0 text-[#8b92a1] transition-transform', isOpen && 'rotate-180')}
          />
        </button>
        {isOpen ? (
          <div
            aria-labelledby={id}
            className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[10px] border border-white/10 bg-[#20242c] p-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.38)]"
            id={menuId}
            onKeyDown={handleMenuKeyDown}
            ref={menuRef}
            role="menu"
          >
            {options.map((option) => (
              <DropdownMenuItem
                isSelected={option.value === value}
                key={option.value}
                onSelect={onValueChange}
                option={option}
                onClose={closeMenu}
              />
            ))}
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}

function DropdownMenuItem({
  isSelected,
  onClose,
  onSelect,
  option,
}: {
  isSelected: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  option: DropdownMenuOption;
}) {
  function handleClick() {
    onSelect(option.value);
    onClose();
  }

  return (
    <button
      aria-checked={isSelected}
      className={classNames(
        'flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left text-[13px] outline-none transition-colors',
        isSelected
          ? 'bg-[#5fdf9b]/12 font-semibold text-[#7ce9ae]'
          : 'text-[#cdd2dc] hover:bg-white/6 hover:text-[#eef0f4] focus-visible:bg-white/8 focus-visible:text-[#eef0f4]',
      )}
      data-value={option.value}
      onClick={handleClick}
      role="menuitemradio"
      tabIndex={-1}
      type="button"
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {isSelected ? <CheckIcon className="size-4" /> : null}
      </span>
      <span>{option.label}</span>
    </button>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 16 16">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 16 16">
      <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}
