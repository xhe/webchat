require 'rubygems'
require 'pushmeup'


APNS.host = 'gateway.sandbox.push.apple.com' 
APNS.port = 2195 
APNS.pem  = '/Users/fhe/webchat/config/ios/dev/ck.pem'
APNS.pass = 'chat4each'

device_token = '6b52f065b7d892faed7ced153784ec8723dd40961ba4ddb8972e704416d2a084'
# APNS.send_notification(device_token, 'Hello iPhone!' )
APNS.send_notification(device_token, :alert => 'PushPlugin works!!', :badge => 1, :sound => 'beep.wav')
