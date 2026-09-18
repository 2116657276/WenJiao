#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AppDelegate : NSObject <NSApplicationDelegate, NSWindowDelegate>
@property (strong) NSWindow *window;
@property (strong) WKWebView *webView;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    // 小型竖向桌面工具窗口：内容区 560 × 780（约占 Mac 屏幕四分之一稍多）
    NSRect frame = NSMakeRect(0, 0, 560, 780);
    // 正常 macOS 原生标题栏：红黄绿系统按钮，标题栏可拖动；固定尺寸，不可缩放
    NSWindowStyleMask style = NSWindowStyleMaskTitled |
                              NSWindowStyleMaskClosable |
                              NSWindowStyleMaskMiniaturizable;

    self.window = [[NSWindow alloc] initWithContentRect:frame
                                              styleMask:style
                                                backing:NSBackingStoreBuffered
                                                  defer:NO];
    [self.window setTitle:@"问筊"];

    [self.window center];
    [self.window setDelegate:self];
    // 宣纸浅暖底色 #F3F0E6
    [self.window setBackgroundColor:[NSColor colorWithRed:243.0/255.0 green:240.0/255.0 blue:230.0/255.0 alpha:1.0]];

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
        NSString *err = @"<html><body style='color:#302C27;background:#F3F0E6;padding:20px;font-family:serif;'><h3>未能加载 index.html</h3></body></html>";
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
