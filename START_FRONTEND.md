# Start Frontend Server

## Step 1: Open a New Terminal

Keep your backend server running in one terminal, open a **NEW** terminal for the frontend.

## Step 2: Navigate to Frontend Directory

```powershell
cd frontend
```

## Step 3: Start Frontend Server

```powershell
npm run dev
```

## Expected Output

You should see something like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Open Browser

Once you see "ready", open your browser to:
```
http://localhost:5173/pipeline
```

## Troubleshooting

### "npm: command not found"
- Make sure Node.js is installed
- Check: `node --version`
- Install Node.js from: https://nodejs.org/

### "Cannot find module"
- Run: `npm install`
- Then try `npm run dev` again

### Port already in use
- Another app is using port 5173
- Vite will automatically use the next available port
- Check the terminal output for the new port number

### Still not working?
- Make sure backend is running on port 8000
- Check that both servers are running
- Look for error messages in the terminal

