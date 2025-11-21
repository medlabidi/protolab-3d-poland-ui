# 🎓 Quick Reference Guide

## 📌 Essential Commands

```bash
# One-time setup
npm run install-all

# Development (both frontend + backend)
npm run dev

# Or separately
npm run dev:client       # React app on port 8080
npm run dev:server       # Express API on port 5000

# Building
npm run build

# Production
npm start
```

## 📂 File Locations

| What | Where |
|------|-------|
| Frontend pages | `src/pages/` |
| Frontend components | `src/components/` |
| Backend routes | `src/routes/` |
| Backend logic | `src/controllers/` |
| Database models | `src/models/` |
| API services | `src/services/` |

## 🔗 URLs in Development

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:5000 |
| Backend health | http://localhost:5000/health |

## 📦 Add Dependencies

```bash
# Frontend only
npm install package --prefix client

# Backend only
npm install package --prefix server

# Both (shared)
npm install package
```

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8080
kill -9 <PID>
```

**Clear cache**
```bash
# Full reset
rm -rf node_modules client/node_modules server/node_modules
npm run install-all
```

**TypeScript errors?**
```bash
npm run build
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `START_HERE.md` | 2-minute overview |
| `SETUP.md` | Detailed setup |
| `NEXT_STEPS.md` | Migration guide |
| `PROJECT_STRUCTURE.md` | File tree |
| `SUMMARY.md` | What was fixed |
| `ARCHITECTURE.txt` | ASCII diagrams |

## 💡 Tips

- Use `npm run dev` to run both servers at once
- Frontend hot-reloads automatically
- Backend auto-restarts with nodemon
- Check `package.json` for all available scripts
- Environment variables go in `server/.env`

---

**Ready to code? Run `npm run dev` and open http://localhost:8080 🚀**
