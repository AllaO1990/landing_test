export enum Timeframe {
  CANDLE_INTERVAL_UNSPECIFIED = 0, //Интервал не определён.
  CANDLE_INTERVAL_1_MIN = 1, //от 1 минуты до 1 дня.
  CANDLE_INTERVAL_5_MIN = 2, //от 5 минут до 1 дня.
  CANDLE_INTERVAL_15_MIN = 3, //от 15 минут до 1 дня.
  CANDLE_INTERVAL_HOUR = 4, //от 1 часа до 1 недели.
  CANDLE_INTERVAL_DAY = 5, //от 1 дня до 1 года.
  CANDLE_INTERVAL_2_MIN = 6, //от 2 минут до 1 дня.
  CANDLE_INTERVAL_3_MIN = 7, //от 3 минут до 1 дня.
  CANDLE_INTERVAL_10_MIN = 8, //от 10 минут до 1 дня.
  CANDLE_INTERVAL_30_MIN = 9, //от 30 минут до 2 дней.
  CANDLE_INTERVAL_2_HOUR = 10, //от 2 часов до 1 месяца.
  CANDLE_INTERVAL_4_HOUR = 11, //от 4 часов до 1 месяца.
  CANDLE_INTERVAL_WEEK = 12, //от 1 недели до 2 лет.
  CANDLE_INTERVAL_MONTH = 13, //от 1 месяца до 10 лет.
}
