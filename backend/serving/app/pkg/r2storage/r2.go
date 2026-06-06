package r2storage

import (
	"context"
	"errors"
	"fmt"
	"path"
	"strings"
	"time"

	"lib/stdid"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	ErrNotConfigured    = errors.New("r2 not configured")
	ErrInvalidMIME      = errors.New("invalid content type")
	ErrInvalidAvatarURL = errors.New("invalid avatar url")
	ErrInvalidMediaKey  = errors.New("invalid media key")
)

// Scope is the top-level R2 folder for a media type.
type Scope string

const (
	ScopeAvatar Scope = "avatars"
	ScopeStatus Scope = "status"
	ScopeChat   Scope = "chat"
)

const (
	putTTL  = 15 * time.Minute
	readTTL = 1 * time.Hour
)

type Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	PublicBaseURL   string
}

func (c Config) Enabled() bool {
	return strings.TrimSpace(c.AccountID) != "" &&
		strings.TrimSpace(c.AccessKeyID) != "" &&
		strings.TrimSpace(c.SecretAccessKey) != "" &&
		strings.TrimSpace(c.Bucket) != "" &&
		strings.TrimSpace(c.PublicBaseURL) != ""
}

type Client struct {
	bucket        string
	publicBaseURL string
	presigner     *s3.PresignClient
}

// UploadSlot is returned when the client needs to PUT bytes to R2.
type UploadSlot struct {
	UploadURL   string `json:"uploadUrl"`
	MediaKey    string `json:"mediaKey"`
	ContentType string `json:"contentType"`
	// PublicURL is set for avatars (public bucket prefix). Omitted for private media.
	PublicURL string `json:"publicUrl,omitempty"`
	// AvatarURL mirrors PublicURL for the existing avatar endpoint.
	AvatarURL string `json:"avatarUrl,omitempty"`
}

// UploadURL is kept for backward compatibility with the avatar endpoint.
type UploadURL struct {
	UploadURL   string `json:"uploadUrl"`
	AvatarURL   string `json:"avatarUrl"`
	ContentType string `json:"contentType"`
}

func New(cfg Config) (*Client, error) {
	if !cfg.Enabled() {
		return nil, ErrNotConfigured
	}
	publicBase := strings.TrimRight(strings.TrimSpace(cfg.PublicBaseURL), "/")

	awsCfg := aws.Config{
		Region: "auto",
		Credentials: credentials.NewStaticCredentialsProvider(
			strings.TrimSpace(cfg.AccessKeyID),
			strings.TrimSpace(cfg.SecretAccessKey),
			"",
		),
		BaseEndpoint: aws.String(fmt.Sprintf(
			"https://%s.r2.cloudflarestorage.com",
			strings.TrimSpace(cfg.AccountID),
		)),
	}

	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true
	})

	return &Client{
		bucket:        strings.TrimSpace(cfg.Bucket),
		publicBaseURL: publicBase,
		presigner:     s3.NewPresignClient(s3Client),
	}, nil
}

func (c *Client) PublicBaseURL() string {
	return c.publicBaseURL
}

func ReadTTL() time.Duration {
	return readTTL
}

func NormalizeImageContentType(raw string) (string, error) {
	ct := strings.ToLower(strings.TrimSpace(raw))
	switch ct {
	case "", "image/jpeg", "image/jpg":
		return "image/jpeg", nil
	case "image/png":
		return "image/png", nil
	case "image/webp":
		return "image/webp", nil
	default:
		return "", ErrInvalidMIME
	}
}

func NormalizeStatusContentType(raw string) (string, error) {
	if ct, err := NormalizeImageContentType(raw); err == nil {
		return ct, nil
	}
	ct := strings.ToLower(strings.TrimSpace(raw))
	if ct == "video/mp4" || ct == "video/quicktime" {
		return "video/mp4", nil
	}
	return "", ErrInvalidMIME
}

func NormalizeChatContentType(raw string) (string, error) {
	if ct, err := NormalizeImageContentType(raw); err == nil {
		return ct, nil
	}
	ct := strings.ToLower(strings.TrimSpace(raw))
	switch ct {
	case "audio/mp4", "audio/m4a", "audio/aac", "audio/mpeg", "audio/x-m4a":
		return "audio/mp4", nil
	default:
		return "", ErrInvalidMIME
	}
}

func extForContentType(ct string) string {
	switch ct {
	case "image/png":
		return "png"
	case "image/webp":
		return "webp"
	case "video/mp4":
		return "mp4"
	case "audio/mp4":
		return "m4a"
	default:
		return "jpg"
	}
}

func (c *Client) PresignPut(
	ctx context.Context,
	scope Scope,
	ownerID stdid.UUID,
	folder string,
	contentType string,
	normalize func(string) (string, error),
) (UploadSlot, error) {
	ct, err := normalize(contentType)
	if err != nil {
		return UploadSlot{}, err
	}

	id, err := stdid.New()
	if err != nil {
		return UploadSlot{}, err
	}

	var key string
	if folder != "" {
		key = fmt.Sprintf(
			"%s/%s/%s/%s.%s",
			scope,
			ownerID.String(),
			sanitizePathSegment(folder),
			id.String(),
			extForContentType(ct),
		)
	} else {
		key = fmt.Sprintf(
			"%s/%s/%s.%s",
			scope,
			ownerID.String(),
			id.String(),
			extForContentType(ct),
		)
	}

	out, err := c.presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(ct),
	}, s3.WithPresignExpires(putTTL))
	if err != nil {
		return UploadSlot{}, fmt.Errorf("presign put: %w", err)
	}

	slot := UploadSlot{
		UploadURL:   out.URL,
		MediaKey:    key,
		ContentType: ct,
	}
	if scope == ScopeAvatar {
		public := c.publicBaseURL + "/" + key
		slot.PublicURL = public
		slot.AvatarURL = public
	}
	return slot, nil
}

func (c *Client) PresignAvatarPut(
	ctx context.Context,
	accountID stdid.UUID,
	contentType string,
) (UploadURL, error) {
	slot, err := c.PresignPut(ctx, ScopeAvatar, accountID, "", contentType, NormalizeImageContentType)
	if err != nil {
		return UploadURL{}, err
	}
	return UploadURL{
		UploadURL:   slot.UploadURL,
		AvatarURL:   slot.AvatarURL,
		ContentType: slot.ContentType,
	}, nil
}

func (c *Client) PresignStatusPut(
	ctx context.Context,
	accountID stdid.UUID,
	contentType string,
) (UploadSlot, error) {
	return c.PresignPut(ctx, ScopeStatus, accountID, "", contentType, NormalizeStatusContentType)
}

func (c *Client) PresignChatPut(
	ctx context.Context,
	accountID stdid.UUID,
	chatID string,
	contentType string,
) (UploadSlot, error) {
	return c.PresignPut(ctx, ScopeChat, accountID, chatID, contentType, NormalizeChatContentType)
}

func (c *Client) PresignGet(ctx context.Context, mediaKey string) (string, error) {
	if err := ValidateMediaKey(mediaKey); err != nil {
		return "", err
	}
	out, err := c.presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(mediaKey),
	}, s3.WithPresignExpires(readTTL))
	if err != nil {
		return "", fmt.Errorf("presign get: %w", err)
	}
	return out.URL, nil
}

func ValidateMediaKey(key string) error {
	key = strings.TrimSpace(key)
	if key == "" {
		return ErrInvalidMediaKey
	}
	if strings.Contains(key, "..") {
		return ErrInvalidMediaKey
	}
	switch {
	case strings.HasPrefix(key, string(ScopeAvatar)+"/"),
		strings.HasPrefix(key, string(ScopeStatus)+"/"),
		strings.HasPrefix(key, string(ScopeChat)+"/"):
		return nil
	default:
		return ErrInvalidMediaKey
	}
}

func ValidateAvatarURL(url, publicBaseURL string) error {
	trimmed := strings.TrimSpace(url)
	if trimmed == "" {
		return nil
	}
	base := strings.TrimRight(strings.TrimSpace(publicBaseURL), "/")
	if base == "" {
		return ErrNotConfigured
	}
	if !strings.HasPrefix(trimmed, base+"/") {
		return ErrInvalidAvatarURL
	}
	return nil
}

func sanitizePathSegment(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "misc"
	}
	var b strings.Builder
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9', r == '-', r == '_':
			b.WriteRune(r)
		default:
			b.WriteRune('_')
		}
	}
	out := b.String()
	if out == "" {
		return "misc"
	}
	return path.Clean(out)
}
