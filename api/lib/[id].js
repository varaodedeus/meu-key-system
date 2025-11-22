import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');

    const { id } = req.query;

    if (!id) {
        return res.status(400).send('-- Error: Library ID not provided');
    }

    try {
        const { db } = await connectToDatabase();
        const panelsCollection = db.collection('panels');

        const panel = await panelsCollection.findOne({ libraryId: id });

        if (!panel) {
            return res.status(404).send('-- Error: Library not found');
        }

        // Gerar script Luau com o key system
        const luauScript = `
-- ⚡ ${panel.name} Key System
-- Library ID: ${id}

local API_URL = "${req.headers.host ? 'https://' + req.headers.host : 'https://meu-key-system.vercel.app'}/api/keys/verify"
local PANEL_ID = "${id}"

local HttpService = game:GetService("HttpService")

local function getHWID()
    return game:GetService("RbxAnalyticsService"):GetClientId()
end

local function verifyKey(key)
    local hwid = getHWID()
    local success, result = pcall(function()
        local response = HttpService:PostAsync(
            API_URL,
            HttpService:JSONEncode({
                key = key,
                hwid = hwid,
                panelId = PANEL_ID
            }),
            Enum.HttpContentType.ApplicationJson
        )
        return HttpService:JSONDecode(response)
    end)
    if success then
        return result
    else
        return { valid = false, error = "Connection error" }
    end
end

local function createUI()
    if game.CoreGui:FindFirstChild("KeySystemUI") then
        game.CoreGui.KeySystemUI:Destroy()
    end

    local ScreenGui = Instance.new("ScreenGui")
    ScreenGui.Name = "KeySystemUI"
    ScreenGui.Parent = game.CoreGui
    ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

    local MainFrame = Instance.new("Frame")
    MainFrame.Name = "MainFrame"
    MainFrame.Parent = ScreenGui
    MainFrame.BackgroundColor3 = Color3.fromRGB(26, 26, 46)
    MainFrame.BorderSizePixel = 0
    MainFrame.Position = UDim2.new(0.5, -200, 0.5, -140)
    MainFrame.Size = UDim2.new(0, 400, 0, 280)
    MainFrame.Active = true
    MainFrame.Draggable = true

    local UICorner = Instance.new("UICorner")
    UICorner.CornerRadius = UDim.new(0, 16)
    UICorner.Parent = MainFrame

    local UIStroke = Instance.new("UIStroke")
    UIStroke.Color = Color3.fromRGB(139, 92, 246)
    UIStroke.Thickness = 2
    UIStroke.Transparency = 0.5
    UIStroke.Parent = MainFrame

    local Title = Instance.new("TextLabel")
    Title.Parent = MainFrame
    Title.BackgroundTransparency = 1
    Title.Position = UDim2.new(0, 0, 0, 25)
    Title.Size = UDim2.new(1, 0, 0, 35)
    Title.Font = Enum.Font.GothamBold
    Title.Text = "🔐 ${panel.name}"
    Title.TextColor3 = Color3.fromRGB(139, 92, 246)
    Title.TextSize = 22

    local Subtitle = Instance.new("TextLabel")
    Subtitle.Parent = MainFrame
    Subtitle.BackgroundTransparency = 1
    Subtitle.Position = UDim2.new(0, 0, 0, 60)
    Subtitle.Size = UDim2.new(1, 0, 0, 20)
    Subtitle.Font = Enum.Font.Gotham
    Subtitle.Text = "Enter your key to continue"
    Subtitle.TextColor3 = Color3.fromRGB(136, 136, 136)
    Subtitle.TextSize = 14

    local KeyBox = Instance.new("TextBox")
    KeyBox.Name = "KeyBox"
    KeyBox.Parent = MainFrame
    KeyBox.BackgroundColor3 = Color3.fromRGB(40, 40, 60)
    KeyBox.BorderSizePixel = 0
    KeyBox.Position = UDim2.new(0.1, 0, 0, 100)
    KeyBox.Size = UDim2.new(0.8, 0, 0, 45)
    KeyBox.Font = Enum.Font.GothamMedium
    KeyBox.PlaceholderText = "KEY-XXXXXXXXXXXXXXXX"
    KeyBox.Text = ""
    KeyBox.TextColor3 = Color3.fromRGB(255, 255, 255)
    KeyBox.TextSize = 15
    KeyBox.ClearTextOnFocus = false

    local KeyCorner = Instance.new("UICorner")
    KeyCorner.CornerRadius = UDim.new(0, 10)
    KeyCorner.Parent = KeyBox

    local VerifyBtn = Instance.new("TextButton")
    VerifyBtn.Name = "VerifyBtn"
    VerifyBtn.Parent = MainFrame
    VerifyBtn.BackgroundColor3 = Color3.fromRGB(139, 92, 246)
    VerifyBtn.BorderSizePixel = 0
    VerifyBtn.Position = UDim2.new(0.1, 0, 0, 160)
    VerifyBtn.Size = UDim2.new(0.8, 0, 0, 45)
    VerifyBtn.Font = Enum.Font.GothamBold
    VerifyBtn.Text = "VERIFY KEY"
    VerifyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    VerifyBtn.TextSize = 16

    local BtnCorner = Instance.new("UICorner")
    BtnCorner.CornerRadius = UDim.new(0, 10)
    BtnCorner.Parent = VerifyBtn

    local Status = Instance.new("TextLabel")
    Status.Name = "Status"
    Status.Parent = MainFrame
    Status.BackgroundTransparency = 1
    Status.Position = UDim2.new(0, 0, 0, 215)
    Status.Size = UDim2.new(1, 0, 0, 40)
    Status.Font = Enum.Font.Gotham
    Status.Text = ""
    Status.TextColor3 = Color3.fromRGB(255, 255, 255)
    Status.TextSize = 14
    Status.TextWrapped = true

    local CloseBtn = Instance.new("TextButton")
    CloseBtn.Parent = MainFrame
    CloseBtn.BackgroundTransparency = 1
    CloseBtn.Position = UDim2.new(1, -35, 0, 5)
    CloseBtn.Size = UDim2.new(0, 30, 0, 30)
    CloseBtn.Font = Enum.Font.GothamBold
    CloseBtn.Text = "X"
    CloseBtn.TextColor3 = Color3.fromRGB(255, 100, 100)
    CloseBtn.TextSize = 18

    CloseBtn.MouseButton1Click:Connect(function()
        ScreenGui:Destroy()
    end)

    VerifyBtn.MouseButton1Click:Connect(function()
        local key = KeyBox.Text
        if key == "" then
            Status.TextColor3 = Color3.fromRGB(255, 100, 100)
            Status.Text = "❌ Please enter a key"
            return
        end

        Status.TextColor3 = Color3.fromRGB(255, 255, 0)
        Status.Text = "⏳ Verifying..."
        VerifyBtn.Text = "VERIFYING..."

        wait(0.5)

        local result = verifyKey(key)

        if result.valid then
            Status.TextColor3 = Color3.fromRGB(100, 255, 100)
            Status.Text = "✅ " .. (result.message or "Key valid!")
            VerifyBtn.Text = "SUCCESS!"
            wait(2)
            ScreenGui:Destroy()
            
            -- KEY VÁLIDA! Coloque seu script aqui:
            print("✅ Key verified for ${panel.name}!")
            -- loadstring(game:HttpGet("YOUR_SCRIPT_URL"))()
            
        else
            Status.TextColor3 = Color3.fromRGB(255, 100, 100)
            Status.Text = "❌ " .. (result.error or "Invalid key")
            VerifyBtn.Text = "VERIFY KEY"
        end
    end)

    return ScreenGui
end

createUI()
print("🔐 ${panel.name} Key System loaded!")
`;

        return res.status(200).send(luauScript);

    } catch (error) {
        console.error(error);
        return res.status(500).send('-- Error: Database error');
    }
}
