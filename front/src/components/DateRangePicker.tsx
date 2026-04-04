import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface DateRangePickerProps {
  onDateSelect: (date: Date) => void;
}

const DateRangePicker = ({ onDateSelect }: DateRangePickerProps) => {
  const [date, setDate] = useState<Date>();
  const today = new Date();
  const maxDate = addDays(today, 7);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      onDateSelect(selectedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline-subtle"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          {date ? (
            format(date, "PPP", { locale: es })
          ) : (
            <span className="text-muted-foreground">Selecciona una fecha</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={(date) => date < today || date > maxDate}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
