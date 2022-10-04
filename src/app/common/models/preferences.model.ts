export class Preferences {
  checkinTime: string;
  checkinTimeAbbvr: string;
  occasion: string;
  room_preference: string[];
  isOccasionSelected: boolean;
}

export class MultiRoomGuestPreference {
  guestPreference: GuestPreferences[];
}

export class GuestPreferences {
  question_type: string;
  question_id: string;
  questionLabel: string;
  option_ids: string[];
  optionsLabel: string[];
  option_text: string;
  preQuestionOptionIds: string[];
  preQuestionOptionLabel: string[];
}

export class GuestPreferenceData {
  isPreQuestion: boolean;
  questionType: string;
  maxOptionsAllowed: number;
  preQuestion: PreQuestion;
  roomQues: RoomQuestion;
  required: boolean;
  settings: any;
  roomPref: string[];
}

export class PreQuestion {
  preQuesId: string;
  preQuesText: string;
  preOptions: PreOptions[];
}

export class RoomQuestion {
  quesID: string;
  quesText: string;
  options: Options[];
}

export class PreOptions {
  preOptionId: string;
  preOptionValue: string;
  showMain: boolean;
  default: boolean;
}

export class Options {
  optionId: string;
  optionValue: string;
  roomNames: string[];
  isDefault: boolean;
}

export class GuestArrivalPreference {
  questionType: string;
  timeQues: TimeQuestion;
  required: boolean;
}

export class TimeQuestion {
  currentAM_PM: string;
  questID: string;
  quesText: string;
  extraInfo: string;
  timeOption: TimeOptions[];
  timeAM: TimeCheckIn[];
  timePM: TimeCheckIn[];
}

export class TimeOptions {
  optionId: string;
  hours: number;
  minute: string;
  AM_PM: string;
}

export class TimeCheckIn {
  optionId: string;
  time: string;
}
