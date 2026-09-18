#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AppDelegate : NSObject <NSApplicationDelegate, NSWindowDelegate>
@property (strong) NSWindow *window;
@property (strong) WKWebView *webView;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    // 理想宽度约 820px，高度约 760px
    NSRect frame = NSMakeRect(0, 0, 820, 760);
    NSWindowStyleMask style = NSWindowStyleMaskTitled |
                              NSWindowStyleMaskClosable |
                              NSWindowStyleMaskMiniaturizable |
                              NSWindowStyleMaskResizable |
                              NSWindowStyleMaskFullSizeContentView;

    self.window = [[NSWindow alloc] initWithContentRect:frame
                                              styleMask:style
                                                backing:NSBackingStoreBuffered
                                                  defer:NO];
    [self.window setTitle:@"问筊"];
    [self.window setTitlebarAppearsTransparent:YES];
    [self.window setTitleVisibility:NSWindowTitleHidden];
    [self.window setMovableByWindowBackground:YES];

    // 窗口尺寸限制：最小 680px，最大 960px，禁止无限拉宽与最大化
    [self.window setMinSize:NSMakeSize(680, 620)];
    [self.window setMaxSize:NSMakeSize(960, 920)];
    [[self.window standardWindowButton:NSWindowZoomButton] setEnabled:NO];

    [self.window center];
    [self.window setDelegate:self];
    // 浅木案桌面底色 #E8DDC3
    [self.window setBackgroundColor:[NSColor colorWithRed:0.91 green:0.87 blue:0.76 alpha:1.0]];

    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    [config.preferences setValue:@YES forKey:@"developerExtrasEnabled"];
    WKWebpagePreferences *prefs = [[WKWebpagePreferences alloc] init];
    prefs.allowsContentJavaScript = YES;
    config.defaultWebpagePreferences = prefs;

    self.webView = [[WKWebView alloc] initWithFrame:[self.window.contentView bounds] configuration:config];
    [self.webView setAutoresizingMask:(NSViewWidthSizable | NSViewHeightSizable)];
    [self.webView setValue:@NO forKey:@"drawsBackground"];
    [[self.window contentView] addSubview:self.webView];

    // 寻找 index.html 路径
    NSURL *targetURL = nil;
    NSURL *resURL = [[NSBundle mainBundle] resourceURL];
    if (resURL) {
        NSURL *bundled = [resURL URLByAppendingPathComponent:@"index.html"];
        if ([[NSFileManager defaultManager] fileExistsAtPath:[bundled path]]) {
            targetURL = bundled;
        }
    }

    if (!targetURL) {
        NSString *execPath = [[NSBundle mainBundle] executablePath];
        if (!execPath) {
            NSArray *args = [[NSProcessInfo processInfo] arguments];
            if (args.count > 0) {
                execPath = args[0];
            }
        }
        NSURL *currentDir = [NSURL fileURLWithPath:[[NSFileManager defaultManager] currentDirectoryPath]];
        NSURL *local = [currentDir URLByAppendingPathComponent:@"index.html"];
        if ([[NSFileManager defaultManager] fileExistsAtPath:[local path]]) {
            targetURL = local;
        }
    }

    if (targetURL) {
        NSURL *baseDir = [targetURL URLByDeletingLastPathComponent];
        [self.webView loadFileURL:targetURL allowingReadAccessToURL:baseDir];
    } else {
        NSString *err = @"<html><body style='color:#302820;background:#E8DDC3;padding:20px;font-family:serif;'><h3>未能加载 index.html</h3></body></html>";
        [self.webView loadHTMLString:err baseURL:nil];
    }

    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}

- (void)windowWillClose:(NSNotification *)notification {
    [NSApp terminate:nil];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        AppDelegate *delegate = [[AppDelegate alloc] init];
        [app setDelegate:delegate];
        [app setActivationPolicy:NSApplicationActivationPolicyRegular];
        [app run];
    }
    return 0;
}
