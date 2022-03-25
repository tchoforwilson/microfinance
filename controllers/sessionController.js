import database from './../config/database.js';
import AppError from './../utils/appError.js';
import catchAsync from './../utils/catchAsync.js';

const Session = database.session;
export const openSession = catchAsync(async (req, res, nex) => {
  // 1. Get current log in user
  const fullname = req.user.firstname + ' ' + req.user.lastname;

  // 2. Open the session
  const session = await Session.create(
    { status: 'open', openBy: fullname },
    {
      fields: ['status', 'openBy'],
    }
  );
  const date = new Date(session.date);
  res.status(200).json({
    status: 'success',
    message: `Session open for ${date.toDateString()}`,
  });
});

export const closeSession = catchAsync(async (req, res, next) => {
  // 1. Get current log in user
  const fullname = req.user.firstname + ' ' + req.user.lastname;

  // 2. Close session
  const session = await Session.update(
    { status: 'close', closeBy: fullname },
    { where: { date: Date.now() } },
    { fields: ['status', 'closeBy'] }
  );
  if (session[0] === 0) {
    return next(new AppError('Session for today not found!', 400));
  }
  res.status(200).json({
    status: 'success',
    message: `Session close for ${new Date()}`,
  });
});

export const getSession = catchAsync(async (req, res, nex) => {
  const session = await Session.findOne({ where: { date: Date.now() } });
  res.status(200).json({
    status: 'success',
    data: session.status,
  });
});

export const sessionIsOpen = catchAsync(async (req, res, next) => {
  const session = await Session.findOne({ where: { date: Date.now() } });
  if (session.status === 'close') {
    return next(
      new AppError(`Session for ${session.date} Closed or Not Open`, 400)
    );
  }
  next();
});
